import { GoogleGenerativeAI } from '@google/generative-ai'
import { getBestAvailableModel } from '../config/gemini'
import { classifyGeminiError } from './errors'
import { getPayload } from 'payload'
import config from '../../payload.config'
import { callGroq } from './groq'

const TIMEOUT_MS = 30000

function timeout(ms: number) {
  return new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Gemini request timed out after ${ms}ms`)), ms)
  )
}

export function recoverJson(rawText: string): Record<string, unknown> {
  const firstBrace = rawText.indexOf('{')
  const lastBrace = rawText.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const extracted = rawText.substring(firstBrace, lastBrace + 1)
    return JSON.parse(extracted) as Record<string, unknown>
  }
  throw new Error('No JSON object boundaries found in raw response')
}

export interface GeminiCallParams {
  requestId: string
  reviewMode: string
  systemPrompt: string
  userPrompt: string
  media?: {
    data: string // base64
    mimeType: string
  }
  projectId?: string
  enableSearch?: boolean // to turn on Google Search grounding
}

export async function callGemini(params: GeminiCallParams) {
  const { requestId, reviewMode, systemPrompt, userPrompt, media, projectId = 'system', enableSearch = false } = params
  
  const payload = await getPayload({ config })
  const enableDebug = process.env.ENABLE_GEMINI_DEBUG === 'true'
  let debugLogId = ''

  const promptLength = systemPrompt.length + userPrompt.length
  const imageBytes = media ? Buffer.from(media.data, 'base64').length : 0

  if (enableDebug) {
    try {
      const debugLog = await payload.create({
        collection: 'gemini_debug_logs',
        data: {
          requestId,
          projectId,
          reviewMode,
          promptLength,
          imageBytes,
          parseSuccess: false
        }
      })
      debugLogId = String(debugLog.id)
    } catch (dbErr) {
      console.error(`[GEMINI-SERVICE][DATABASE][${requestId}] Failed to create debug log:`, dbErr)
    }
  }

  const modelName = await getBestAvailableModel()
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured')
  }

  const genAI = new GoogleGenerativeAI(apiKey)
  const jsonEnforcement = `\nReturn valid JSON only. No markdown. No explanations. No code fences.`
  const finalSystemPrompt = systemPrompt + jsonEnforcement

  const contentParts: Array<string | { inlineData: { data: string; mimeType: string } }> = [
    userPrompt,
    finalSystemPrompt
  ]

  if (media) {
    contentParts.push({
      inlineData: {
        data: media.data,
        mimeType: media.mimeType
      }
    })
  }

  let rawText = ''
  try {
    const modelConfig = {
      model: modelName,
      ...(enableSearch ? { tools: [{ googleSearchRetrieval: {} }] } : {})
    }
    const model = genAI.getGenerativeModel(modelConfig)
    
    console.log(`[GEMINI-SERVICE][${requestId}] Calling model '${modelName}' (Search grounded: ${enableSearch})`)
    const geminiPromise = model.generateContent(contentParts).then(res => res.response.text())
    rawText = await Promise.race([geminiPromise, timeout(TIMEOUT_MS)])
  } catch (err: unknown) {
    const { errorType, errorMessage } = classifyGeminiError(err)
    console.error(`[GEMINI-SERVICE][${requestId}] Gemini execution failed:`, errorMessage)
    
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
    
    throw err
  }

  if (enableDebug && debugLogId) {
    await payload.update({
      collection: 'gemini_debug_logs',
      id: debugLogId,
      data: {
        modelUsed: modelName,
        rawResponse: rawText
      }
    }).catch(() => {})
  }

  // Parse and sanitize JSON
  let cleanedResponse = rawText.trim()
  const firstBraceIndex = cleanedResponse.indexOf('{')
  if (firstBraceIndex > 0) {
    cleanedResponse = cleanedResponse.substring(firstBraceIndex)
  }
  
  cleanedResponse = cleanedResponse
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim()

  let parsed: unknown = null
  try {
    parsed = JSON.parse(cleanedResponse)
  } catch (initialErr) {
    console.warn(`[GEMINI-SERVICE][PARSE][${requestId}] Initial JSON.parse failed. Retrying fallback recovery extraction...`)
    try {
      parsed = recoverJson(rawText)
    } catch (recoveryErr) {
      const parseErrorMessage = `JSON parsing failed: ${(initialErr as Error).message}`
      console.error(`[GEMINI-SERVICE][PARSE][${requestId}] Recovery parsing failed:`, recoveryErr)
      
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
      throw new Error(parseErrorMessage)
    }
  }

  // Success!
  if (enableDebug && debugLogId) {
    await payload.update({
      collection: 'gemini_debug_logs',
      id: debugLogId,
      data: { parseSuccess: true }
    }).catch(() => {})
  }

  return {
    parsed,
    rawText,
    modelUsed: modelName
  }
}

export interface AICallParams {
  requestId: string
  reviewMode: string
  systemPrompt: string
  userPrompt: string
  media?: {
    data: string // base64
    mimeType: string
  }
  projectId?: string
  enableSearch?: boolean
}

export interface AIResponse {
  provider: 'gemini' | 'groq'
  data: {
    parsed: unknown
    rawText: string
    modelUsed: string
  }
}

/**
 * High-level AI router.
 * Attempts Gemini first, and gracefully falls back to Groq for rate limits or quota issues.
 */
export async function callAI(params: AICallParams): Promise<AIResponse> {
  const { requestId, reviewMode, systemPrompt, userPrompt, media } = params

  try {
    const geminiResult = await callGemini(params)

    // Log the successful provider in Payload debug logs (Gemini by default)
    try {
      const payload = await getPayload({ config })
      const logs = await payload.find({
        collection: 'gemini_debug_logs',
        where: {
          requestId: { equals: requestId }
        }
      })
      if (logs.docs.length > 0) {
        await payload.update({
          collection: 'gemini_debug_logs',
          id: logs.docs[0].id,
          data: {
            provider: 'gemini'
          }
        })
      }
    } catch (dbLogErr) {
      console.error(`[AI-ROUTER][${requestId}] Failed to update debug log for Gemini:`, dbLogErr)
    }

    return {
      provider: 'gemini',
      data: {
        parsed: geminiResult.parsed,
        rawText: geminiResult.rawText,
        modelUsed: geminiResult.modelUsed
      }
    }
  } catch (err: unknown) {
    const { errorType, errorMessage } = classifyGeminiError(err)
    
    // Check if we should fallback to Groq
    const isRateLimitOrQuota = errorType === 'RATE_LIMIT' || errorType === 'QUOTA_EXCEEDED' || errorMessage.includes('429')
    
    if (isRateLimitOrQuota) {
      console.log(`AI Provider: Groq Fallback`)

      try {
        const groqResult = await callGroq({
          requestId,
          reviewMode,
          systemPrompt,
          userPrompt,
          media
        })

        // Update Payload logs to reflect Groq fallback success
        try {
          const payload = await getPayload({ config })
          const logs = await payload.find({
            collection: 'gemini_debug_logs',
            where: {
              requestId: { equals: requestId }
            }
          })
          if (logs.docs.length > 0) {
            await payload.update({
              collection: 'gemini_debug_logs',
              id: logs.docs[0].id,
              data: {
                provider: 'groq',
                modelUsed: groqResult.modelUsed,
                parseSuccess: true,
                errorType: null,
                errorMessage: null
              }
            })
          }
        } catch (dbLogErr) {
          console.error(`[AI-ROUTER][${requestId}] Failed to update debug log for Groq fallback:`, dbLogErr)
        }

        return {
          provider: 'groq',
          data: {
            parsed: groqResult.parsed,
            rawText: groqResult.rawText,
            modelUsed: groqResult.modelUsed
          }
        }
      } catch (groqErr: unknown) {
        // Both failed! Log Groq error to payload logs
        const groqMsg = groqErr instanceof Error ? groqErr.message : String(groqErr)
        console.error(`[AI-ROUTER][${requestId}] Groq fallback also failed:`, groqMsg)

        try {
          const payload = await getPayload({ config })
          const logs = await payload.find({
            collection: 'gemini_debug_logs',
            where: {
              requestId: { equals: requestId }
            }
          })
          if (logs.docs.length > 0) {
            await payload.update({
              collection: 'gemini_debug_logs',
              id: logs.docs[0].id,
              data: {
                parseSuccess: false,
                errorType: 'GROQ_ERROR',
                errorMessage: `Gemini failed: ${errorMessage}. Groq fallback failed: ${groqMsg}`
              }
            })
          }
        } catch {
          // Ignore log errors
        }

        // Throw generic user-friendly error to avoid leaking stack traces
        throw new Error('AI analysis services are currently overloaded. Please try again in a few minutes.')
      }
    } else {
      // For non-rate-limit/non-quota errors, propagate the original error immediately
      console.error(`[AI-ROUTER][${requestId}] Propagating original non-fallback Gemini error:`, errorMessage)
      throw err
    }
  }
}

