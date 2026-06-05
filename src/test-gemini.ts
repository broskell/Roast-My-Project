import { GoogleGenerativeAI } from '@google/generative-ai'

async function test() {
  const apiKey = process.env.GEMINI_API_KEY
  console.log(`API Key: ${apiKey}`)
  
  if (!apiKey) {
    console.error('No GEMINI_API_KEY environment variable found!')
    process.exit(1)
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    console.log('Sending test message to Gemini using gemini-2.0-flash...')
    const result = await model.generateContent("Say hello")
    console.log('Success! Response:')
    console.log(result.response.text())
    process.exit(0)
  } catch (err: unknown) {
    console.error('Gemini Request failed with error:')
    console.error(err)
    process.exit(1)
  }
}

test()
