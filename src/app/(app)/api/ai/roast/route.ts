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

    const { projectId, mode } = await req.json()
    if (!projectId || !mode) {
      return NextResponse.json({ error: 'Project ID and Mode are required' }, { status: 400 })
    }

    const validModes = [
      'Funny Roast',
      'Brutal Roast',
      'Recruiter Review',
      'Senior Developer Review',
      'Investor Review',
    ]

    if (!validModes.includes(mode)) {
      return NextResponse.json({ error: 'Invalid review mode' }, { status: 400 })
    }

    const payload = await getPayload({ config })

    // 2. Fetch project
    const project = await payload.findByID({
      collection: 'projects',
      id: projectId,
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Check project ownership (relationship stores ID, need to compare safely)
    const projectUserId = typeof project.user === 'object' ? project.user.id : project.user
    if (projectUserId.toString() !== user.id.toString()) {
      return NextResponse.json({ error: 'Forbidden: You do not own this project' }, { status: 403 })
    }

    // 3. Fetch prompt from database Prompts collection
    const prompts = await payload.find({
      collection: 'prompts',
      where: {
        key: { equals: mode }
      }
    })

    if (prompts.docs.length === 0) {
      return NextResponse.json({ error: `System prompt template not found for mode: ${mode}` }, { status: 500 })
    }

    const promptTemplate = prompts.docs[0]

    // 4. Download and convert screenshot image to base64
    let base64Image = ''
    let mimeType = 'image/jpeg'
    try {
      const response = await axios.get(project.screenshotUrl, { responseType: 'arraybuffer' })
      const buffer = Buffer.from(response.data)
      base64Image = buffer.toString('base64')
      
      // Attempt to infer MIME type from file extension in URL
      const extension = project.screenshotUrl.split('.').pop()?.toLowerCase()
      if (extension === 'png') {
        mimeType = 'image/png'
      } else if (extension === 'webp') {
        mimeType = 'image/webp'
      }
    } catch (err: any) {
      console.error('Failed to download project screenshot for AI:', err.message)
      return NextResponse.json({ error: 'Failed to retrieve project screenshot from storage for AI analysis' }, { status: 500 })
    }

    // 5. Initialize Gemini SDK
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API Key is not configured' }, { status: 500 })
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    // 6. Request Gemini review
    const systemPrompt = promptTemplate.promptText
    const userPrompt = `
Analyze this project:
Title: ${project.title}
Description: ${project.description}
GitHub Repository: ${project.githubUrl || 'N/A'}
Live URL: ${project.liveUrl || 'N/A'}

Analyze the screenshot and description based on the system instructions, detect the category of the project from the list (Portfolio, SaaS, E-Commerce, Dashboard, Landing Page, Mobile App, Blog, Other), and output the JSON response.
`

    const contentParts = [
      userPrompt,
      systemPrompt,
      {
        inlineData: {
          data: base64Image,
          mimeType,
        }
      }
    ]

    let responseText = ''
    try {
      const result = await model.generateContent(contentParts)
      responseText = result.response.text()
    } catch (err: any) {
      console.error('Gemini API execution error:', err.message)
      return NextResponse.json({ error: 'Gemini AI failed to process review: ' + err.message }, { status: 502 })
    }

    // 7. Parse response JSON
    let reviewData
    try {
      // Strip out markdown block if present
      let cleanJson = responseText.replace(/```json/gi, '').replace(/```/g, '').trim()
      
      // Sometimes Gemini outputs JSON with wrapping brackets or text before/after. Try to find the JSON boundaries.
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
    const { roast, review, strengths, weaknesses, suggestions, score, category } = reviewData
    if (!roast || !review || !score) {
      return NextResponse.json({
        error: 'Gemini review response was missing core fields (roast, review, score)',
        rawText: responseText
      }, { status: 502 })
    }

    // 8. Update project category if detected
    const categoryOptions = ['Portfolio', 'SaaS', 'E-Commerce', 'Dashboard', 'Landing Page', 'Mobile App', 'Blog', 'Other']
    let detectedCategory = category && categoryOptions.includes(category) ? category : 'Other'
    
    if (detectedCategory !== project.category) {
      await payload.update({
        collection: 'projects',
        id: project.id,
        data: {
          category: detectedCategory,
        }
      })
    }

    // 9. Delete existing review for this project and mode to prevent duplicates
    await payload.delete({
      collection: 'reviews',
      where: {
        and: [
          { project: { equals: project.id } },
          { mode: { equals: mode } }
        ]
      }
    })

    // 10. Save the new review
    // Format strengths, weaknesses, and suggestions to match Payload schema (array of objects)
    const formattedStrengths = Array.isArray(strengths) 
      ? strengths.map((s: string) => ({ strength: s })) 
      : [{ strength: String(strengths || 'Not analyzed') }]
      
    const formattedWeaknesses = Array.isArray(weaknesses) 
      ? weaknesses.map((w: string) => ({ weakness: w })) 
      : [{ weakness: String(weaknesses || 'Not analyzed') }]
      
    const formattedSuggestions = Array.isArray(suggestions) 
      ? suggestions.map((s: string) => ({ suggestion: s })) 
      : [{ suggestion: String(suggestions || 'Not analyzed') }]

    const reviewDoc = await payload.create({
      collection: 'reviews',
      data: {
        roast,
        review,
        strengths: formattedStrengths,
        weaknesses: formattedWeaknesses,
        suggestions: formattedSuggestions,
        score: Number(score),
        mode,
        project: project.id,
      }
    })

    return NextResponse.json({
      success: true,
      review: {
        id: reviewDoc.id,
        roast: reviewDoc.roast,
        review: reviewDoc.review,
        strengths: strengths || [],
        weaknesses: weaknesses || [],
        suggestions: suggestions || [],
        score: reviewDoc.score,
        mode: reviewDoc.mode,
        category: detectedCategory,
        projectId: project.id,
      }
    })

  } catch (err: any) {
    console.error('Error in roast API:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
