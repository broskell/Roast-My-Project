import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '../../../../../payload.config'
import { getAuthenticatedUser } from '../../../../../src/utils/auth'
import crypto from 'crypto'

import { validateEnv } from '../../../../../src/lib/env'
import { callAI } from '../../../../../src/lib/gemini'
import { classifyGeminiError } from '../../../../../src/lib/errors'
import { validateIdeaResearchReport } from '../../../../../src/types/ai'
import { startTimer, endTimer } from '../../../../../src/lib/timing'
import { compileEvidence } from '../../../../../src/lib/search'

// GET /api/idea-research - Get all research reports for the current user
export async function GET(req: Request) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await getPayload({ config })
    const reports = await payload.find({
      collection: 'idea_reports',
      where: {
        createdBy: { equals: user.id }
      },
      sort: '-createdAt',
      limit: 100
    })

    return NextResponse.json({
      success: true,
      reports: reports.docs
    })
  } catch (err) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const errorObj = err as any
    console.error('Error in GET /api/idea-research:', errorObj)
    return NextResponse.json({ error: errorObj.message || 'Internal Server Error' }, { status: 500 })
  }
}

// POST /api/idea-research - Create a new startup idea research report
export async function POST(req: Request) {
  const totalTimer = startTimer()
  const requestId = crypto.randomUUID()

  console.log(`[IDEA-RESEARCH][STEP-1][VALIDATION] Request correlation ID generated: ${requestId}`)

  try {
    // 0. Startup env validation
    validateEnv()

    // 1. Authenticate user
    const user = await getAuthenticatedUser(req)
    if (!user) {
      console.error(`[IDEA-RESEARCH][STEP-1][VALIDATION][${requestId}] Unauthorized request`)
      return NextResponse.json({
        requestId,
        stage: 'validation',
        error: 'Unauthorized'
      }, { status: 401 })
    }

    const body = (await req.json()) as {
      title?: string
      description?: string
      targetAudience?: string
      industry?: string
      countryRegion?: string
    }

    const { title, description, targetAudience, industry, countryRegion } = body
    console.log(`[IDEA-RESEARCH][STEP-1][VALIDATION][${requestId}] Parameters:`, { title, industry, countryRegion, userId: user.id })

    if (!title || !description || !targetAudience || !industry) {
      console.error(`[IDEA-RESEARCH][STEP-1][VALIDATION][${requestId}] Missing required fields`)
      return NextResponse.json({
        requestId,
        stage: 'validation',
        error: 'Title, Description, Target Audience, and Industry are required'
      }, { status: 400 })
    }

    const payload = await getPayload({ config })

    // 2. Fetch prompt from database Prompts collection
    console.log(`[IDEA-RESEARCH][STEP-2][PROMPT][${requestId}] Loading prompt template for Idea Research`)
    const promptsResult = await payload.find({
      collection: 'prompts',
      where: {
        key: { equals: 'Idea Research' }
      }
    })

    if (promptsResult.docs.length === 0) {
      console.error(`[IDEA-RESEARCH][STEP-2][PROMPT][${requestId}] Prompt template not found for Idea Research`)
      return NextResponse.json({
        requestId,
        stage: 'validation',
        error: 'System prompt template not found for Idea Research'
      }, { status: 500 })
    }

    const promptTemplate = promptsResult.docs[0]
    const promptText = promptTemplate.promptText

    // 3. Compile search grounding evidence
    console.log(`[IDEA-RESEARCH][STEP-3][SEARCH][${requestId}] Gathering grounding evidence package...`)
    let compiledEvidence = ''
    try {
      compiledEvidence = await compileEvidence(title, description, industry, targetAudience)
    } catch (searchErr) {
      console.error(`[IDEA-RESEARCH][STEP-3][SEARCH][${requestId}] Evidence gathering failed:`, searchErr)
      compiledEvidence = 'Web search results temporarily unavailable. Base your analysis on general market knowledge.'
    }

    const userPrompt = `
Analyze the following startup idea:
Idea Name: ${title}
Description: ${description}
Target Audience: ${targetAudience}
Industry: ${industry}
Country/Region: ${countryRegion || 'Global'}

Here is the real-world web search evidence collected for this concept:
"""
${compiledEvidence}
"""

Analyze this search evidence, identify direct/indirect competitors, active operations, acquisitions, and shutdowns. Do not fabricate or hallucinate any facts. Ensure the output strictly conforms to the JSON schema.
`

    let parsed: unknown = null
    let aiProvider: string = 'gemini'
    let modelUsed: string = ''
    try {
      const result = await callAI({
        requestId,
        reviewMode: 'Idea Research',
        systemPrompt: promptText,
        userPrompt,
        projectId: 'idea-project',
        enableSearch: false // Decoupled search grounding
      })
      parsed = result.data.parsed
      aiProvider = result.provider
      modelUsed = result.data.modelUsed
    } catch (err: unknown) {
      const { errorMessage } = classifyGeminiError(err)
      console.error(`[IDEA-RESEARCH][STEP-3][AI-COMPLETION][${requestId}] AI service execution error:`, errorMessage)
      const statusObj = err as { status?: number } | null | undefined
      return NextResponse.json({
        requestId,
        stage: 'gemini-request',
        error: `AI failed to research idea: ${errorMessage}`
      }, { status: statusObj?.status || 502 })
    }

    // 4. Validate output schema
    console.log(`[IDEA-RESEARCH][STEP-4][VALIDATION][${requestId}] Validating response schema`)
    if (!validateIdeaResearchReport(parsed)) {
      const errorMsg = 'Gemini response missing or failed schema validation constraints'
      console.error(`[IDEA-RESEARCH][STEP-4][VALIDATION][${requestId}] Schema validation failed`)
      return NextResponse.json({
        requestId,
        stage: 'schema-validation',
        error: errorMsg
      }, { status: 502 })
    }

    // 5. Save report to database
    console.log(`[IDEA-RESEARCH][STEP-5][DATABASE][${requestId}] Saving report to database`)
    const dbSaveStart = startTimer()
    
    const reportDoc = await payload.create({
      collection: 'idea_reports',
      data: {
        title,
        description,
        targetAudience,
        industry,
        countryRegion: countryRegion || 'Global',
        report: parsed,
        createdBy: user.id,
        provider: aiProvider,
        modelUsed,
        requestId,
      }
    })

    const dbDuration = endTimer(dbSaveStart)
    const totalDuration = endTimer(totalTimer)

    console.log(`[IDEA-RESEARCH][SUCCESS][${requestId}] Success metrics:`, {
      reportId: reportDoc.id,
      dbSaveTime: `${dbDuration}ms`,
      totalTime: `${totalDuration}ms`
    })

    return NextResponse.json({
      success: true,
      report: reportDoc
    })

  } catch (err) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const errorObj = err as any
    console.error(`[IDEA-RESEARCH][CRITICAL][${requestId}] Unhandled exception:`, errorObj)
    return NextResponse.json({
      requestId,
      stage: 'database-save',
      error: errorObj.message || 'Internal Server Error'
    }, { status: 500 })
  }
}
