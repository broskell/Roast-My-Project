import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '../../../../../../payload.config'
import { getAuthenticatedUser } from '../../../../../utils/auth'
import axios from 'axios'
import crypto from 'crypto'

import { validateEnv } from '../../../../../lib/env'
import { callAI } from '../../../../../lib/gemini'
import { classifyGeminiError } from '../../../../../lib/errors'
import { validateResumeReview } from '../../../../../types/ai'
import { startTimer, endTimer } from '../../../../../lib/timing'

export async function POST(req: Request) {
  const totalTimer = startTimer()
  const requestId = crypto.randomUUID()

  console.log(`[RESUME-ROAST][STEP-1][VALIDATION] Request correlation ID generated: ${requestId}`)

  try {
    // 0. Startup env validation
    validateEnv()

    // 1. Authenticate user
    const user = await getAuthenticatedUser(req)
    if (!user) {
      console.error(`[RESUME-ROAST][STEP-1][VALIDATION][${requestId}] Unauthorized request`)
      return NextResponse.json({
        requestId,
        stage: 'validation',
        error: 'Unauthorized'
      }, { status: 401 })
    }

    const contentType = req.headers.get('content-type') || ''
    let resumeUrl = ''
    let resumePublicId = ''
    let uploadedFile: File | null = null

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      const fileValue = formData.get('file')
      uploadedFile = fileValue instanceof File ? fileValue : null
      resumeUrl = String(formData.get('resumeUrl') || '')
      resumePublicId = String(formData.get('resumePublicId') || '')
    } else {
      const body = (await req.json()) as { resumeUrl?: string; resumePublicId?: string }
      resumeUrl = body.resumeUrl || ''
      resumePublicId = body.resumePublicId || ''
    }

    console.log(`[RESUME-ROAST][STEP-1][VALIDATION][${requestId}] Resume review parameters:`, {
      hasUploadedFile: Boolean(uploadedFile),
      resumeUrl,
      resumePublicId,
      userId: user.id
    })

    if (!resumeUrl) {
      console.error(`[RESUME-ROAST][STEP-1][VALIDATION][${requestId}] Missing resumeUrl`)
      return NextResponse.json({
        requestId,
        stage: 'validation',
        error: 'Resume URL is required'
      }, { status: 400 })
    }

    const payload = await getPayload({ config })

    // 2. Fetch prompt from database Prompts collection
    console.log(`[RESUME-ROAST][STEP-2][PROMPT][${requestId}] Loading prompt template for Resume Review`)
    const promptsResult = await payload.find({
      collection: 'prompts',
      where: {
        key: { equals: 'Resume Review' }
      }
    })

    if (promptsResult.docs.length === 0) {
      console.error(`[RESUME-ROAST][STEP-2][PROMPT][${requestId}] Prompt template not found for Resume Review`)
      return NextResponse.json({
        requestId,
        stage: 'validation',
        error: 'System prompt template not found for Resume Review'
      }, { status: 500 })
    }

    const promptTemplate = promptsResult.docs[0]
    const promptText = promptTemplate.promptText

    // 3. Load resume PDF bytes from the multipart upload, falling back to the saved URL for older clients.
    let base64Pdf = ''
    let buffer: Buffer

    const downloadTimer = startTimer()
    if (uploadedFile) {
      console.log(`[RESUME-ROAST][STEP-3][PDF-BYTES][${requestId}] Reading PDF from multipart upload: ${uploadedFile.name}`)
      buffer = Buffer.from(await uploadedFile.arrayBuffer())
      if (buffer.length === 0) {
        return NextResponse.json({
          requestId,
          stage: 'pdf-validation',
          error: 'Resume PDF buffer is empty'
        }, { status: 400 })
      }
      base64Pdf = buffer.toString('base64')
    } else {
      console.log(`[RESUME-ROAST][STEP-3][DOWNLOAD][${requestId}] Downloading PDF resume from URL: ${resumeUrl}`)
      try {
        const response = await axios.get(resumeUrl, { responseType: 'arraybuffer' })
        buffer = Buffer.from(response.data as ArrayBuffer)
        if (buffer.length === 0) {
          throw new Error('Resume PDF buffer is empty')
        }
        base64Pdf = buffer.toString('base64')
      } catch (err: unknown) {
        const errorObj = err as { message?: string } | null | undefined
        console.error(`[RESUME-ROAST][STEP-3][DOWNLOAD][${requestId}] Failed to download resume PDF:`, errorObj?.message || err)
        return NextResponse.json({
          requestId,
          stage: 'pdf-download',
          error: `Failed to retrieve resume PDF from storage: ${errorObj?.message || err}`
        }, { status: 502 })
      }
    }
    const downloadDuration = endTimer(downloadTimer)

    // 3.5 Validate PDF file details
    console.log(`[RESUME-ROAST][STEP-3.5][VALIDATE-PDF][${requestId}] Validating PDF magic bytes and size`)
    
    // Check max size: 5MB limit
    if (buffer.length > 5 * 1024 * 1024) {
      console.error(`[RESUME-ROAST][STEP-3.5][VALIDATE-PDF][${requestId}] File size exceeds limit: ${buffer.length} bytes`)
      return NextResponse.json({
        requestId,
        stage: 'pdf-validation',
        error: 'Resume PDF size must be less than 5MB'
      }, { status: 400 })
    }

    // Check PDF magic bytes (should start with '%PDF')
    const hasPdfHeader = buffer.length >= 4 && buffer.toString('utf-8', 0, 4) === '%PDF'
    if (!hasPdfHeader) {
      console.error(`[RESUME-ROAST][STEP-3.5][VALIDATE-PDF][${requestId}] Magic bytes check failed. Buffer begins with:`, buffer.toString('utf-8', 0, 10))
      return NextResponse.json({
        requestId,
        stage: 'pdf-validation',
        error: 'The uploaded file is not a valid PDF document. Please upload a PDF file.'
      }, { status: 400 })
    }

    // 4. Call shared Gemini service
    let parsed: unknown = null
    let aiProvider: string = 'gemini'
    let modelUsed: string = ''
    try {
      const result = await callAI({
        requestId,
        reviewMode: 'Resume Review',
        systemPrompt: promptText,
        userPrompt: 'Analyze the attached resume PDF document based on the system instructions, score it out of 100, and output the response matching the specified JSON schema.',
        media: {
          data: base64Pdf,
          mimeType: 'application/pdf',
        },
        projectId: 'resume-project'
      })
      parsed = result.data.parsed
      aiProvider = result.provider
      modelUsed = result.data.modelUsed
    } catch (err: unknown) {
      const { errorMessage } = classifyGeminiError(err)
      console.error(`[RESUME-ROAST][STEP-4][AI-COMPLETION][${requestId}] AI service execution error:`, errorMessage)
      const statusObj = err as { status?: number } | null | undefined
      return NextResponse.json({
        requestId,
        stage: 'gemini-request',
        error: `AI analysis failed: ${errorMessage}`
      }, { status: statusObj?.status || 502 })
    }

    // 5. Validate response schema
    console.log(`[RESUME-ROAST][STEP-5][PARSE][${requestId}] Validating response schema`)
    if (!validateResumeReview(parsed)) {
      const errorMsg = 'Gemini response missing required fields (roast, score, suggestions)'
      console.error(`[RESUME-ROAST][STEP-5][PARSE][${requestId}] Schema validation failed: ${errorMsg}`)
      return NextResponse.json({
        requestId,
        stage: 'schema-validation',
        error: errorMsg
      }, { status: 502 })
    }

    // 6. Save the new resume review
    console.log(`[RESUME-ROAST][STEP-6][DATABASE][${requestId}] Saving review to database`)
    const dbSaveStart = startTimer()
    const { roast, score, suggestions } = parsed

    const formattedSuggestions = suggestions.map((s: unknown) => {
      const item = s as { suggestion?: string } | null | undefined
      return { suggestion: String(item?.suggestion || s) }
    })

    const resumeDoc = await payload.create({
      collection: 'resumes',
      data: {
        resumeUrl,
        resumePublicId: resumePublicId || '',
        roast,
        suggestions: formattedSuggestions,
        score: Number(score),
        user: user.id,
        provider: aiProvider,
        modelUsed,
        requestId,
      }
    })

    const dbDuration = endTimer(dbSaveStart)
    const totalDuration = endTimer(totalTimer)

    // Log success metrics
    console.log(`[RESUME-ROAST][STEP-6][DATABASE][${requestId}] Success metrics:`, {
      reviewSaved: true,
      reviewId: resumeDoc.id,
      downloadTime: `${downloadDuration}ms`,
      databaseSaveTime: `${dbDuration}ms`,
      totalRequestTime: `${totalDuration}ms`
    })

    return NextResponse.json({
      success: true,
      resumeReview: {
        id: resumeDoc.id,
        roast: resumeDoc.roast,
        suggestions: suggestions || [],
        score: resumeDoc.score,
        resumeUrl: resumeDoc.resumeUrl,
      }
    })

  } catch (err: unknown) {
    const { errorMessage } = classifyGeminiError(err)
    console.error(`[RESUME-ROAST][CRITICAL][${requestId}] Unhandled pipeline exception:`, err)
    return NextResponse.json({
      requestId,
      stage: 'database-save',
      error: errorMessage || 'Internal Server Error'
    }, { status: 500 })
  }
}
