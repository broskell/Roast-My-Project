import { GoogleGenerativeAI } from '@google/generative-ai'

export const GEMINI_MODELS = [
  'gemini-3.5-flash',
  'gemini-2.5-flash',
  'gemini-2.0-flash'
]

let cachedModel: string | null = null

export async function getBestAvailableModel(): Promise<string> {
  if (cachedModel) {
    return cachedModel
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.warn('[GEMINI-CONFIG] No API key configured, defaulting to first model')
    return GEMINI_MODELS[0]
  }

  const genAI = new GoogleGenerativeAI(apiKey)

  for (const modelName of GEMINI_MODELS) {
    try {
      console.log(`[GEMINI-CONFIG] Verifying model availability: ${modelName}`)
      const model = genAI.getGenerativeModel({ model: modelName })
      
      // Use a short 4-second timeout to check access
      const pingPromise = model.generateContent('Say OK').then(() => true)
      const timeoutPromise = new Promise<boolean>((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 4000)
      )

      const success = await Promise.race([pingPromise, timeoutPromise])
      if (success) {
        console.log(`[GEMINI-CONFIG] Selected working model: ${modelName}`)
        cachedModel = modelName
        return cachedModel
      }
    } catch (err: unknown) {
      const errorObj = err as { message?: string } | null | undefined
      console.warn(`[GEMINI-CONFIG] Model verification failed for ${modelName}:`, errorObj?.message || err)
    }
  }

  console.warn('[GEMINI-CONFIG] All models failed verification, falling back to:', GEMINI_MODELS[0])
  cachedModel = GEMINI_MODELS[0]
  return cachedModel
}
