import { GoogleGenerativeAI } from '@google/generative-ai'

async function discoverAndTest() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error('No GEMINI_API_KEY found!')
    process.exit(1)
  }

  const genAI = new GoogleGenerativeAI(apiKey)

  console.log('--- Step 1: Discovering Available Models ---')
  let availableModels: string[] = []
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    const response = await fetch(url)
    const data = (await response.json()) as { models?: Array<{ name: string }> }
    if (data.models) {
      availableModels = data.models.map((m: { name: string }) => m.name.replace('models/', ''))
      console.log('Models found in account list:', availableModels)
    } else {
      console.error('Failed to parse models list:', data)
    }
  } catch (err) {
    console.error('Error fetching available models:', err)
  }

  console.log('\n--- Step 2: Testing Flash Models Sequentially ---')
  const testModels = ['gemini-3.5-flash', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash']
  
  for (const modelName of testModels) {
    console.log(`\nTesting model: ${modelName}`)
    try {
      const model = genAI.getGenerativeModel({ model: modelName })
      const result = await model.generateContent("Respond with OK")
      const text = result.response.text().trim()
      console.log(`[SUCCESS] Model "${modelName}" is accessible. Response: ${text}`)
    } catch (err: unknown) {
      const errorObj = err as { status?: number; name?: string; message?: string; errorDetails?: unknown } | null | undefined
      console.log(`[FAILED] Model "${modelName}" failed. Status/Message details:`)
      console.log(`- Status code/type: ${errorObj?.status || errorObj?.name || 'N/A'}`)
      console.log(`- Error Message: ${errorObj?.message || String(err)}`)
      if (errorObj?.errorDetails) {
        console.log(`- Error Details:`, JSON.stringify(errorObj.errorDetails))
      }
    }
  }
  process.exit(0)
}

discoverAndTest()
