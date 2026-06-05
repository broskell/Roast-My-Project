import axios from 'axios'
import zlib from 'zlib'
import { recoverJson } from './gemini'

export interface GroqCallParams {
  requestId: string
  reviewMode: string
  systemPrompt: string
  userPrompt: string
  media?: {
    data: string // base64
    mimeType: string
  }
}

/**
 * Safely extracts ASCII and text strings from a PDF Buffer
 * by decompressing Flate streams and pulling text chunks.
 */
function extractTextFromPdf(pdfBuffer: Buffer): string {
  let text = ''
  let pos = 0

  while (true) {
    const streamIdx = pdfBuffer.indexOf('stream', pos)
    if (streamIdx === -1) break

    const endStreamIdx = pdfBuffer.indexOf('endstream', streamIdx)
    if (endStreamIdx === -1) break

    let startOfData = streamIdx + 6
    if (pdfBuffer[startOfData] === 0x0d && pdfBuffer[startOfData + 1] === 0x0a) {
      startOfData += 2
    } else if (pdfBuffer[startOfData] === 0x0a) {
      startOfData += 1
    }

    const streamData = pdfBuffer.subarray(startOfData, endStreamIdx)
    pos = endStreamIdx + 9

    const objHeaderStart = Math.max(0, streamIdx - 100)
    const headerContext = pdfBuffer.toString('ascii', objHeaderStart, streamIdx)
    const isFlate = headerContext.includes('/FlateDecode')

    let decompressed: Buffer | null = null
    if (isFlate) {
      try {
        decompressed = zlib.inflateSync(streamData)
      } catch {
        try {
          decompressed = zlib.unzipSync(streamData)
        } catch {
          // ignore
        }
      }
    } else {
      decompressed = streamData
    }

    if (decompressed) {
      const decStr = decompressed.toString('utf-8')
      const parenthesizedRegex = /\(([^)]*)\)/g
      let match
      let streamText = ''
      while ((match = parenthesizedRegex.exec(decStr)) !== null) {
        const token = match[1]
        const cleanToken = token
          .replace(/\\([\(\)\\])/g, '$1')
          .replace(/\\r/g, '')
          .replace(/\\n/g, ' ')
          .replace(/\\t/g, ' ')
        
        if (cleanToken.trim().length > 0) {
          streamText += cleanToken + ' '
        }
      }
      if (streamText.length > 0) {
        text += streamText + '\n'
      }
    }
  }

  if (text.trim().length === 0) {
    const decStr = pdfBuffer.toString('ascii')
    const matches = decStr.match(/[\x20-\x7E]{4,}/g)
    if (matches) {
      text = matches.join('\n')
    }
  }

  return text
}

/**
 * Invokes the Groq API using standard axios chat completions.
 * Enforces JSON mode and selects appropriate text or vision models.
 */
export async function callGroq(params: GroqCallParams) {
  const { requestId, systemPrompt, userPrompt, media } = params
  const apiKey = process.env.GROQ_API_KEY

  if (!apiKey) {
    throw new Error('GROQ_API_KEY is not configured')
  }

  let activeMedia = media
  let activeUserPrompt = userPrompt

  // PDF files cannot be processed by Llama 3.2 Vision. Extract text and use text-only model.
  if (media && media.mimeType === 'application/pdf') {
    console.log(`[GROQ-SERVICE][${requestId}] PDF media detected. Extracting text for text-based analysis...`)
    try {
      const pdfBuffer = Buffer.from(media.data, 'base64')
      const extractedText = extractTextFromPdf(pdfBuffer)
      activeUserPrompt = `${userPrompt}\n\nHere is the text content extracted from the resume PDF:\n"""\n${extractedText}\n"""`
      activeMedia = undefined
      console.log(`[GROQ-SERVICE][${requestId}] PDF text extraction complete. Chars: ${extractedText.length}`)
    } catch (err) {
      console.error(`[GROQ-SERVICE][${requestId}] PDF text extraction failed, trying fallback:`, err)
    }
  }

  // Model selection
  // Llama 3.2 90b Vision is standard for images, Llama 3.3 70b is stable for text
  const modelName = activeMedia 
    ? 'llama-3.2-90b-vision-preview' 
    : 'llama-3.3-70b-versatile'

  console.log(`[GROQ-SERVICE][${requestId}] Calling model '${modelName}' (multimodal: ${!!activeMedia})`)

  const jsonEnforcement = `\nReturn valid JSON only. Do not wrap in markdown code blocks. Output the raw JSON structure starting with { and ending with }`
  const finalSystemPrompt = systemPrompt + jsonEnforcement

  // Build OpenAI-style message payload
  const messages: { role: string; content: unknown }[] = [
    { role: 'system', content: finalSystemPrompt }
  ]

  if (activeMedia) {
    // OpenAI standard multimodal format
    messages.push({
      role: 'user',
      content: [
        { type: 'text', text: activeUserPrompt },
        {
          type: 'image_url',
          image_url: {
            url: `data:${activeMedia.mimeType};base64,${activeMedia.data}`
          }
        }
      ]
    })
  } else {
    messages.push({ role: 'user', content: activeUserPrompt })
  }

  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: modelName,
        messages,
        temperature: 0.2,
        response_format: { type: 'json_object' } // Guarantees JSON output!
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30s timeout
      }
    )

    const rawText = response.data.choices?.[0]?.message?.content || ''
    
    // Parse response
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
      console.warn(`[GROQ-SERVICE][PARSE][${requestId}] Initial JSON.parse failed. Retrying fallback recovery...`)
      try {
        parsed = recoverJson(rawText)
      } catch {
        throw new Error(`JSON parsing failed: ${(initialErr as Error).message}`)
      }
    }

    return {
      parsed,
      rawText,
      modelUsed: modelName
    }
  } catch (err: unknown) {
    const errorObj = err as { response?: { data?: { error?: { message?: string } } } };
    const errObj = err as Error;
    const groqErrorMsg = errorObj.response?.data?.error?.message || errObj.message || String(err)
    console.error(`[GROQ-SERVICE][${requestId}] Groq completion execution failed:`, groqErrorMsg)
    throw new Error(`Groq execution failed: ${groqErrorMsg}`)
  }
}
