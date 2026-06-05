import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '../../../../../../payload.config'
import { getAuthenticatedUser } from '../../../../../utils/auth'
import axios from 'axios'
import crypto from 'crypto'
import sharp from 'sharp'

import { validateEnv } from '../../../../../lib/env'
import { callAI } from '../../../../../lib/gemini'
import { classifyGeminiError } from '../../../../../lib/errors'
import { validateProjectReview } from '../../../../../types/ai'
import { startTimer, endTimer } from '../../../../../lib/timing'



export async function POST(req: Request) {
  const totalTimer = startTimer()
  const requestId = crypto.randomUUID()

  console.log(`[ROAST][STEP-1][VALIDATION] Request correlation ID generated: ${requestId}`)

  try {
    // 0. Startup env validation
    validateEnv()

    // 1. Authenticate user
    const user = await getAuthenticatedUser(req)
    if (!user) {
      console.error(`[ROAST][STEP-1][VALIDATION][${requestId}] Unauthorized request`)
      return NextResponse.json({
        requestId,
        stage: 'validation',
        errorType: 'INVALID_API_KEY',
        error: 'Unauthorized'
      }, { status: 401 })
    }

    const body = (await req.json()) as { projectId?: string; mode?: string }
    const { projectId, mode } = body
    console.log(`[ROAST][STEP-1][VALIDATION][${requestId}] Roast request parameters:`, { projectId, mode, userId: user.id })

    if (!projectId || !mode) {
      console.error(`[ROAST][STEP-1][VALIDATION][${requestId}] Missing projectId or mode`)
      return NextResponse.json({
        requestId,
        stage: 'validation',
        errorType: 'VALIDATION_ERROR',
        error: 'Project ID and Mode are required'
      }, { status: 400 })
    }

    const validModes = [
      'Funny Roast',
      'Brutal Roast',
      'Recruiter Review',
      'Senior Developer Review',
      'Investor Review',
    ]

    if (!validModes.includes(mode)) {
      console.error(`[ROAST][STEP-1][VALIDATION][${requestId}] Invalid mode: ${mode}`)
      return NextResponse.json({
        requestId,
        stage: 'validation',
        errorType: 'VALIDATION_ERROR',
        error: `Invalid review mode. Must be one of: ${validModes.join(', ')}`
      }, { status: 400 })
    }

    const payload = await getPayload({ config })

    // Fetch project
    const project = await payload.findByID({
      collection: 'projects',
      id: projectId,
    })

    if (!project) {
      console.error(`[ROAST][STEP-1][VALIDATION][${requestId}] Project not found: ${projectId}`)
      return NextResponse.json({
        requestId,
        stage: 'validation',
        errorType: 'VALIDATION_ERROR',
        error: 'Project not found'
      }, { status: 404 })
    }

    // Check project ownership
    const projectUserId = typeof project.user === 'object' ? project.user.id : project.user
    if (projectUserId.toString() !== user.id.toString()) {
      console.error(`[ROAST][STEP-1][VALIDATION][${requestId}] Forbidden: Project owner mismatch`)
      return NextResponse.json({
        requestId,
        stage: 'validation',
        errorType: 'INVALID_API_KEY',
        error: 'Forbidden: You do not own this project'
      }, { status: 403 })
    }

    // Screenshot URL validation
    if (!project.screenshotUrl) {
      console.error(`[ROAST][STEP-1][VALIDATION][${requestId}] Project screenshot URL is missing`)
      return NextResponse.json({
        requestId,
        stage: 'validation',
        errorType: 'VALIDATION_ERROR',
        error: 'Project screenshot missing'
      }, { status: 400 })
    }

    // 2. Fetch prompt from database
    console.log(`[ROAST][STEP-2][PROMPT][${requestId}] Loading prompt template for mode: ${mode}`)
    const promptsResult = await payload.find({
      collection: 'prompts',
      where: {
        key: { equals: mode }
      }
    })

    if (promptsResult.docs.length === 0) {
      console.error(`[ROAST][STEP-2][PROMPT][${requestId}] Prompt template not found for mode: ${mode}`)
      return NextResponse.json({
        requestId,
        stage: 'prompt-loading',
        errorType: 'VALIDATION_ERROR',
        error: `System prompt template not found for mode: ${mode}`
      }, { status: 500 })
    }

    const promptTemplate = promptsResult.docs[0]
    const promptText = promptTemplate.promptText

    // Log prompt preview
    console.log(`[ROAST][PROMPT-PREVIEW]`, {
      reviewMode: mode,
      promptLength: promptText.length,
      preview: promptText.substring(0, 500)
    })

    // 3. Download screenshot & run diagnostics
    console.log(`[ROAST][STEP-3][IMAGE][${requestId}] Downloading screenshot from URL: ${project.screenshotUrl}`)
    let base64Image = ''
    let mimeType = 'image/jpeg'
    let buffer: Buffer

    const downloadTimer = startTimer()
    try {
      const response = await axios.get(project.screenshotUrl, { responseType: 'arraybuffer' })
      const rawContentType = response.headers['content-type']
      const contentType = typeof rawContentType === 'string' ? rawContentType : 'image/jpeg'

      if (response.status !== 200) {
        throw new Error(`Non-200 download status: ${response.status}`)
      }

      buffer = Buffer.from(response.data as ArrayBuffer)
      if (buffer.length === 0) {
        throw new Error('Screenshot image buffer is empty')
      }

      // Read dimensions using sharp metadata diagnostics
      let imageDimensions = 'unknown'
      try {
        const metadata = await sharp(buffer).metadata()
        imageDimensions = `${metadata.width || 0}x${metadata.height || 0}`
        if (!metadata.width || !metadata.height) {
          throw new Error('Could not parse image width/height')
        }
      } catch (sharpErr: unknown) {
        const errorObj = sharpErr as { message?: string } | null | undefined
        console.error(`[ROAST][STEP-3][IMAGE][${requestId}] Sharp image validation failed:`, errorObj?.message || sharpErr)
        return NextResponse.json({
          requestId,
          stage: 'image-download',
          errorType: 'VALIDATION_ERROR',
          error: 'Invalid image format'
        }, { status: 400 })
      }

      console.log(`[ROAST][STEP-3][IMAGE]`, {
        contentType,
        contentLength: buffer.length,
        imageDimensions
      })

      // Simple content type validation (accept jpeg, png, webp, gif)
      if (!contentType.startsWith('image/')) {
        return NextResponse.json({
          requestId,
          stage: 'image-download',
          errorType: 'VALIDATION_ERROR',
          error: `Invalid image format: ${contentType}`
        }, { status: 400 })
      }

      base64Image = buffer.toString('base64')
      
      const extension = project.screenshotUrl.split('.').pop()?.toLowerCase()
      if (extension === 'png') {
        mimeType = 'image/png'
      } else if (extension === 'webp') {
        mimeType = 'image/webp'
      }
    } catch (err: unknown) {
      const errorObj = err as { message?: string } | null | undefined
      console.error(`[ROAST][STEP-3][IMAGE][${requestId}] Screenshot download failed:`, errorObj?.message || err)
      return NextResponse.json({
        requestId,
        stage: 'image-download',
        errorType: 'NETWORK_ERROR',
        error: `Failed to retrieve project screenshot: ${errorObj?.message || err}`
      }, { status: 502 })
    }
    const downloadDuration = endTimer(downloadTimer)

    // Call centralized Gemini service
    let parsed: unknown = null
    let aiProvider: string = 'gemini'
    let modelUsed: string = ''
    try {
      const result = await callAI({
        requestId,
        reviewMode: mode,
        systemPrompt: promptText,
        userPrompt: `
Analyze this project:
Title: ${project.title}
Description: ${project.description}
GitHub Repository: ${project.githubUrl || 'N/A'}
Live URL: ${project.liveUrl || 'N/A'}

Analyze the screenshot and description, detect the category from [Portfolio, SaaS, E-Commerce, Dashboard, Landing Page, Mobile App, Blog, Other], and return valid JSON output only.
`,
        media: {
          data: base64Image,
          mimeType,
        },
        projectId: String(project.id)
      })
      parsed = result.data.parsed
      aiProvider = result.provider
      modelUsed = result.data.modelUsed
    } catch (err: unknown) {
      const { errorType, errorMessage } = classifyGeminiError(err)
      console.error(`[ROAST][STEP-4][AI-COMPLETION][${requestId}] AI service execution error:`, errorMessage)
      const statusObj = err as { status?: number } | null | undefined
      return NextResponse.json({
        requestId,
        stage: 'gemini-request',
        errorType,
        error: errorMessage
      }, { status: statusObj?.status || 502 })
    }

    // Validate response schema
    console.log(`[ROAST][STEP-5][PARSE][${requestId}] Validating Gemini response schema`)
    if (!validateProjectReview(parsed)) {
      const errorMsg = 'Gemini response missing required fields'
      console.error(`[ROAST][STEP-5][PARSE][${requestId}] Schema validation failed: ${errorMsg}`)
      return NextResponse.json({
        requestId,
        stage: 'schema-validation',
        errorType: 'VALIDATION_ERROR',
        error: errorMsg
      }, { status: 502 })
    }

    // 6. Save review to database
    console.log(`[ROAST][STEP-6][DATABASE][${requestId}] Saving review to database`)
    const dbSaveStart = startTimer()
    const { roast, review, strengths, weaknesses, suggestions, score, category } = parsed

    const detectedCategory = category && typeof category === 'string' ? category : 'Other'
    if (detectedCategory !== project.category) {
      await payload.update({
        collection: 'projects',
        id: project.id,
        data: {
          category: detectedCategory,
        }
      })
    }

    // Delete existing review for this project and mode to prevent duplicates
    await payload.delete({
      collection: 'reviews',
      where: {
        and: [
          { project: { equals: project.id } },
          { mode: { equals: mode } }
        ]
      }
    })

    const formattedStrengths = strengths.map((s: unknown) => {
      const item = s as { strength?: string } | null | undefined
      return { strength: String(item?.strength || s) }
    })
    const formattedWeaknesses = weaknesses.map((w: unknown) => {
      const item = w as { weakness?: string } | null | undefined
      return { weakness: String(item?.weakness || w) }
    })
    const formattedSuggestions = suggestions.map((s: unknown) => {
      const item = s as { suggestion?: string } | null | undefined
      return { suggestion: String(item?.suggestion || s) }
    })

    const reviewDoc = await payload.create({
      collection: 'reviews',
      data: {
        roast,
        review,
        strengths: formattedStrengths,
        weaknesses: formattedWeaknesses,
        suggestions: formattedSuggestions,
        score,
        mode,
        project: project.id,
        provider: aiProvider,
        modelUsed,
        requestId,
      }
    })

    const dbDuration = endTimer(dbSaveStart)
    const totalDuration = endTimer(totalTimer)

    // Log success metrics
    console.log(`[ROAST][STEP-6][DATABASE][${requestId}] Success metrics:`, {
      reviewSaved: true,
      reviewId: reviewDoc.id,
      downloadTime: `${downloadDuration}ms`,
      databaseSaveTime: `${dbDuration}ms`,
      totalRequestTime: `${totalDuration}ms`
    })

    return NextResponse.json({
      success: true,
      review: {
        id: reviewDoc.id,
        roast: reviewDoc.roast,
        review: reviewDoc.review,
        strengths: strengths,
        weaknesses: weaknesses,
        suggestions: suggestions,
        score: reviewDoc.score,
        mode: reviewDoc.mode,
        category: detectedCategory,
        projectId: project.id,
      }
    })

  } catch (err: unknown) {
    const { errorType, errorMessage } = classifyGeminiError(err)
    console.error(`[ROAST][CRITICAL][${requestId}] Unhandled pipeline exception:`, err)
    return NextResponse.json({
      requestId,
      stage: 'database-save',
      errorType,
      error: errorMessage || 'Internal Server Error'
    }, { status: 500 })
  }
}
