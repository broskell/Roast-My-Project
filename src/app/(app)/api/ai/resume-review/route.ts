import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '../../../../../../payload.config'
import { getAuthenticatedUser } from '../../../../../utils/auth'
import { GoogleGenerativeAI } from '@google/generative-ai'
import axios from 'axios'
import crypto from 'crypto'

import { validateEnv } from '../../../../../lib/env'
import { getBestAvailableModel } from '../../../../../config/gemini'
import { classifyGeminiError } from '../../../../../lib/errors'
import { validateResumeReview } from '../../../../../types/ai'
import { startTimer, endTimer } from '../../../../../lib/timing'

const TIMEOUT_MS = 30000

function timeout(ms: number) {
  return new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Gemini request timed out after ${ms}ms`)), ms)
  )
}

function recoverJson(rawText: string): Record<string, unknown> {
  const firstBrace = rawText.indexOf('{')
  const lastBrace = rawText.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const extracted = rawText.substring(firstBrace, lastBrace + 1)
    return JSON.parse(extracted) as Record<string, unknown>
  }
  throw new Error('No JSON object boundaries found in raw response')
}

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
        errorType: 'INVALID_API_KEY',
        error: 'Unauthorized'
      }, { status: 401 })
    }

    const body = (await req.json()) as { resumeUrl?: string; resumePublicId?: string }
    const { resumeUrl, resumePublicId } = body
    console.log(`[RESUME-ROAST][STEP-1][VALIDATION][${requestId}] Resume review parameters:`, { resumeUrl, resumePublicId, userId: user.id })

    if (!resumeUrl) {
      console.error(`[RESUME-ROAST][STEP-1][VALIDATION][${requestId}] Missing resumeUrl`)
      return NextResponse.json({
        requestId,
        stage: 'validation',
        errorType: 'VALIDATION_ERROR',
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
        stage: 'prompt-loading',
        errorType: 'VALIDATION_ERROR',
        error: 'System prompt template not found for Resume Review'
      }, { status: 500 })
    }

    const promptTemplate = promptsResult.docs[0]
    const promptText = promptTemplate.promptText

    // Log prompt preview
    console.log(`[RESUME-ROAST][PROMPT-PREVIEW]`, {
      reviewMode: 'Resume Review',
      promptLength: promptText.length,
      preview: promptText.substring(0, 500)
    })

    // 3. Download and convert PDF to base64
    console.log(`[RESUME-ROAST][STEP-3][DOWNLOAD][${requestId}] Downloading PDF resume from URL: ${resumeUrl}`)
    let base64Pdf = ''
    let buffer: Buffer

    const downloadTimer = startTimer()
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
        stage: 'image-download',
        errorType: 'NETWORK_ERROR',
        error: `Failed to retrieve resume PDF from storage: ${errorObj?.message || err}`
      }, { status: 500 })
    }
    const downloadDuration = endTimer(downloadTimer)

    // Save debug log if enabled
    const enableDebug = process.env.ENABLE_GEMINI_DEBUG === 'true'
    let debugLogId = ''
    if (enableDebug) {
      try {
        const debugLog = await payload.create({
          collection: 'gemini_debug_logs',
          data: {
            requestId,
            projectId: 'resume-project',
            reviewMode: 'Resume Review',
            promptLength: promptText.length,
            imageBytes: buffer.length,
            parseSuccess: false
          }
        })
        debugLogId = String(debugLog.id)
      } catch (dbErr: unknown) {
        const errorObj = dbErr as { message?: string } | null | undefined
        console.error(`[RESUME-ROAST][DATABASE][${requestId}] Failed to create debug log:`, errorObj?.message || dbErr)
      }
    }

    // 4. Resolve cached working model & request review
    const modelName = await getBestAvailableModel()
    console.log(`[RESUME-ROAST][STEP-4][GEMINI][${requestId}] Discovered/Cached model to use: ${modelName}`)

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      console.error(`[RESUME-ROAST][STEP-4][GEMINI][${requestId}] Gemini API key is missing`)
      return NextResponse.json({
        requestId,
        stage: 'gemini-request',
        errorType: 'INVALID_API_KEY',
        error: 'Gemini API Key is not configured'
      }, { status: 500 })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const jsonEnforcement = `
\nReturn valid JSON only.
No markdown.
No explanations.
No code fences.
`
    const systemPrompt = promptText + jsonEnforcement
    const userPrompt = 'Analyze the attached resume PDF document based on the system instructions, score it out of 100, and output the response matching the specified JSON schema.'

    const contentParts = [
      userPrompt,
      systemPrompt,
      {
        inlineData: {
          data: base64Pdf,
          mimeType: 'application/pdf',
        }
      }
    ]

    let responseText = ''
    const geminiCallStart = startTimer()

    try {
      const model = genAI.getGenerativeModel({ model: modelName })
      console.log(`[RESUME-ROAST][STEP-4][GEMINI][${requestId}] Calling model '${modelName}' with 30s timeout`)

      const geminiPromise = model.generateContent(contentParts).then(res => res.response.text())
      responseText = await Promise.race([geminiPromise, timeout(TIMEOUT_MS)])
    } catch (err: unknown) {
      const { errorType, errorMessage } = classifyGeminiError(err)
      console.error(`[RESUME-ROAST][STEP-4][GEMINI][${requestId}] Gemini API execution error:`, errorMessage)
      
      if (enableDebug && debugLogId) {
        await payload.update({
          collection: 'gemini_debug_logs',
          id: debugLogId,
          data: {
            modelUsed: modelName,
            errorType,
            errorMessage
          }
        }).catch(() => {})
      }

      const statusObj = err as { status?: number } | null | undefined
      return NextResponse.json({
        requestId,
        stage: 'gemini-request',
        errorType,
        error: `Gemini AI failed to process resume: ${errorMessage}`
      }, { status: statusObj?.status || 502 })
    }

    const geminiDuration = endTimer(geminiCallStart)
    console.log(`[RESUME-ROAST][STEP-4][GEMINI][${requestId}] Raw Gemini response received (length: ${responseText.length}, duration: ${geminiDuration}ms)`)

    // Save response to debug log if debugging is enabled
    if (enableDebug && debugLogId) {
      await payload.update({
        collection: 'gemini_debug_logs',
        id: debugLogId,
        data: {
          modelUsed: modelName,
          rawResponse: responseText
        }
      }).catch(() => {})
    }

    // 5. Parse response JSON
    console.log(`[RESUME-ROAST][STEP-5][PARSE][${requestId}] Sanitizing response and parsing JSON`)
    let reviewData: unknown = null
    const parseStart = startTimer()

    let cleanJson = responseText.trim()
    
    // Strip leading text by locating the first bracket
    const firstBraceIndex = cleanJson.indexOf('{')
    if (firstBraceIndex > 0) {
      cleanJson = cleanJson.substring(firstBraceIndex)
    }
    
    cleanJson = cleanJson
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim()

    try {
      reviewData = JSON.parse(cleanJson)
    } catch (initialErr: unknown) {
      const errorObj = initialErr as { message?: string } | null | undefined
      console.warn(`[RESUME-ROAST][STEP-5][PARSE][${requestId}] Initial JSON.parse failed. Retrying fallback recovery:`, errorObj?.message || initialErr)
      try {
        reviewData = recoverJson(responseText)
      } catch (recoveryErr: unknown) {
        const recoveryObj = recoveryErr as { message?: string } | null | undefined
        const parseErrorMessage = `JSON parsing failed: ${errorObj?.message || initialErr}`
        console.error(`[RESUME-ROAST][STEP-5][PARSE][${requestId}] JSON parsing recovery failed:`, recoveryObj?.message || recoveryErr)
        
        if (enableDebug && debugLogId) {
          await payload.update({
            collection: 'gemini_debug_logs',
            id: debugLogId,
            data: {
              parseError: parseErrorMessage,
              errorType: 'UNKNOWN',
              errorMessage: parseErrorMessage
            }
          }).catch(() => {})
        }

        return NextResponse.json({
          requestId,
          stage: 'json-parse',
          errorType: 'UNKNOWN',
          error: parseErrorMessage,
          rawText: responseText
        }, { status: 502 })
      }
    }

    const parseDuration = endTimer(parseStart)

    // Validate parsed JSON fields against ResumeReview schema
    console.log(`[RESUME-ROAST][STEP-5][PARSE][${requestId}] Validating response schema`)
    if (!validateResumeReview(reviewData)) {
      const errorMsg = 'Gemini response missing required fields (roast, score, suggestions)'
      console.error(`[RESUME-ROAST][STEP-5][PARSE][${requestId}] Schema validation failed: ${errorMsg}`)
      
      if (enableDebug && debugLogId) {
        await payload.update({
          collection: 'gemini_debug_logs',
          id: debugLogId,
          data: {
            parseError: errorMsg,
            errorType: 'VALIDATION_ERROR',
            errorMessage: errorMsg
          }
        }).catch(() => {})
      }

      return NextResponse.json({
        requestId,
        stage: 'schema-validation',
        errorType: 'VALIDATION_ERROR',
        error: errorMsg,
        rawText: responseText
      }, { status: 502 })
    }

    // Success! Update debug log success flag
    if (enableDebug && debugLogId) {
      await payload.update({
        collection: 'gemini_debug_logs',
        id: debugLogId,
        data: { parseSuccess: true }
      }).catch(() => {})
    }

    // 6. Save the new resume review
    console.log(`[RESUME-ROAST][STEP-6][DATABASE][${requestId}] Saving review to database`)
    const dbSaveStart = startTimer()
    const { roast, score, suggestions } = reviewData

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
      }
    })

    const dbDuration = endTimer(dbSaveStart)
    const totalDuration = endTimer(totalTimer)

    // Log success metrics
    console.log(`[RESUME-ROAST][STEP-6][DATABASE][${requestId}] Success metrics:`, {
      reviewSaved: true,
      reviewId: resumeDoc.id,
      responseLength: responseText.length,
      downloadTime: `${downloadDuration}ms`,
      parseTime: `${parseDuration}ms`,
      geminiExecutionTime: `${geminiDuration}ms`,
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
    const { errorType, errorMessage } = classifyGeminiError(err)
    console.error(`[RESUME-ROAST][CRITICAL][${requestId}] Unhandled pipeline exception:`, err)
    return NextResponse.json({
      requestId,
      stage: 'database-save',
      errorType,
      error: errorMessage || 'Internal Server Error'
    }, { status: 500 })
  }
}
