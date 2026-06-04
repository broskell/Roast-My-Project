import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '../../../../../../payload.config'
import { getAuthenticatedUser } from '../../../../../utils/auth'
import { GoogleGenerativeAI } from '@google/generative-ai'
import axios from 'axios'

export async function POST(req: Request) {
  try {
    // 1. Authenticate user
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { resumeUrl, resumePublicId } = await req.json()
    if (!resumeUrl) {
      return NextResponse.json({ error: 'Resume URL is required' }, { status: 400 })
    }

    const payload = await getPayload({ config })

    // 2. Fetch prompt from database Prompts collection
    const prompts = await payload.find({
      collection: 'prompts',
      where: {
        key: { equals: 'Resume Review' }
      }
    })

    if (prompts.docs.length === 0) {
      return NextResponse.json({ error: 'System prompt template not found for Resume Review' }, { status: 500 })
    }

    const promptTemplate = prompts.docs[0]

    // 3. Download and convert PDF to base64
    let base64Pdf = ''
    try {
      const response = await axios.get(resumeUrl, { responseType: 'arraybuffer' })
      const buffer = Buffer.from(response.data)
      base64Pdf = buffer.toString('base64')
    } catch (err: any) {
      console.error('Failed to download resume PDF for AI:', err.message)
      return NextResponse.json({ error: 'Failed to retrieve resume PDF from storage for AI analysis' }, { status: 500 })
    }

    // 4. Initialize Gemini SDK
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API Key is not configured' }, { status: 500 })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    // 5. Request Gemini review
    const systemPrompt = promptTemplate.promptText
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
    try {
      const result = await model.generateContent(contentParts)
      responseText = result.response.text()
    } catch (err: any) {
      console.error('Gemini API execution error:', err.message)
      return NextResponse.json({ error: 'Gemini AI failed to process resume: ' + err.message }, { status: 502 })
    }

    // 6. Parse response JSON
    let reviewData
    try {
      // Strip out markdown block if present
      let cleanJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim()
      
      const startIdx = cleanJson.indexOf('{')
      const endIdx = cleanJson.lastIndexOf('}')
      if (startIdx !== -1 && endIdx !== -1) {
        cleanJson = cleanJson.substring(startIdx, endIdx + 1)
      }
      
      reviewData = JSON.parse(cleanJson)
    } catch (err: any) {
      console.error('Failed to parse Gemini response as JSON. Raw text was:', responseText)
      return NextResponse.json({
        error: 'Gemini returned an invalid JSON response structure. Please try again.',
        rawText: responseText
      }, { status: 502 })
    }

    // Validate parsed JSON fields
    const { roast, score, suggestions } = reviewData
    if (!roast || !score) {
      return NextResponse.json({
        error: 'Gemini review response was missing core fields (roast, score)',
        rawText: responseText
      }, { status: 502 })
    }

    // 7. Save the new resume review
    const formattedSuggestions = Array.isArray(suggestions) 
      ? suggestions.map((s: string) => ({ suggestion: s })) 
      : [{ suggestion: String(suggestions || 'Not analyzed') }]

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

  } catch (err: any) {
    console.error('Error in resume-review API:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
