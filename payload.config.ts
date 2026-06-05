import { buildConfig } from 'payload'
import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import sharp from 'sharp'
import { fileURLToPath } from 'url'
import path from 'path'

import { Admins } from './src/collections/Admins'
import { Users } from './src/collections/Users'
import { OtpVerifications } from './src/collections/OtpVerifications'
import { Projects } from './src/collections/Projects'
import { Reviews } from './src/collections/Reviews'
import { Resumes } from './src/collections/Resumes'
import { Prompts } from './src/collections/Prompts'
import { GeminiDebugLogs } from './src/collections/GeminiDebugLogs'
import { IdeaReports } from './src/collections/IdeaReports'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Admins.slug,
    importMap: {
      // Used by Payload 3.x for custom components
    },
    components: {
      beforeDashboard: [
        '/src/components/AdminAnalytics#AdminAnalytics'
      ]
    }
  },
  collections: [
    Admins,
    Users,
    OtpVerifications,
    Projects,
    Reviews,
    Resumes,
    Prompts,
    GeminiDebugLogs,
    IdeaReports,
  ],
  editor: lexicalEditor({}),
  secret: process.env.PAYLOAD_SECRET || 'd1a7b4f593e820c78a0f9b6e4d3c2b1a5e6f7d8c9b0a1b2c3d4e5f6',
  db: mongooseAdapter({
    url: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/roast-my-project',
  }),
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  onInit: async (payload) => {
    // 1. Create TTL index for otp_verifications in MongoDB
    const mongoose = (payload.db as any).mongoose
    if (mongoose) {
      try {
        await mongoose.connection.db.collection('otp_verifications').createIndex(
          { expiresAt: 1 },
          { expireAfterSeconds: 0 }
        )
        payload.logger.info('MongoDB TTL index created for otp_verifications')
      } catch (err: any) {
        payload.logger.error('Failed to create TTL index for otp_verifications: ' + err.message)
      }
    }

    // 2. Seed default prompts if they don't exist
    const defaultPrompts = [
      {
        key: 'Funny Roast',
        promptText: `You are a hilarious, witty tech roaster. Review this project submission (screenshot and description). Give a funny, sarcastic, but extremely entertaining roast of their design, tech choices, and overall concept. Keep the roast witty and lighthearted. Also provide a serious review (constructive technical feedback), a list of exactly 3 strengths, exactly 3 weaknesses, exactly 3 improvement suggestions, and a final score from 1 to 10. You must return your response in a raw JSON format (no markdown code blocks, just the JSON string) matching this schema:
{
  "roast": "your witty roast here",
  "review": "your technical constructive review here",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2", "weakness 3"],
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
  "score": 7
}`,
        description: 'Humorous, sarcastic critique of the project and technical aspects.',
      },
      {
        key: 'Brutal Roast',
        promptText: `You are an mercilessly honest, brutal developer critic. Review this project submission (screenshot and description). Do not hold back. Roast it to the ground. Be extremely savage about any flaws in UI/UX, database structure, scalability, logic, or overall concept. Also provide a serious review, exactly 3 strengths (if you can find any), exactly 3 weaknesses, exactly 3 improvement suggestions, and a final score from 1 to 10. You must return your response in a raw JSON format matching this schema:
{
  "roast": "your brutal roast here",
  "review": "your technical constructive review here",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2", "weakness 3"],
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
  "score": 3
}`,
        description: 'Savage, zero-compromise technical review and UI roasting.',
      },
      {
        key: 'Recruiter Review',
        promptText: `You are a professional technical recruiter looking for talented software engineers. Review this project submission (screenshot and description) from a hiring perspective. Critique its commercial viability, portfolio appeal, presentation, user-friendliness, and visual design. Provide a recruiter review, exactly 3 strengths, exactly 3 weaknesses, exactly 3 improvement suggestions, and a final score from 1 to 10. You must return your response in a raw JSON format matching this schema:
{
  "roast": "your recruiter-style humorous critique here",
  "review": "your professional recruiter constructive review here",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2", "weakness 3"],
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
  "score": 8
}`,
        description: 'Feedback focusing on employability, portfolio suitability, and presentation.',
      },
      {
        key: 'Senior Developer Review',
        promptText: `You are a Senior Principal Software Architect. Review this project (screenshot and description). Focus on system design, performance, UI layout, security, best practices, and code cleanliness. Provide a thorough, constructive architectural review, exactly 3 strengths, exactly 3 weaknesses, exactly 3 improvement suggestions, and a final score from 1 to 10. You must return your response in a raw JSON format matching this schema:
{
  "roast": "your senior-dev humorous/cynical critique here",
  "review": "your deep technical review here",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2", "weakness 3"],
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
  "score": 6
}`,
        description: 'Deep technical, performance, and security architecture critique.',
      },
      {
        key: 'Investor Review',
        promptText: `You are a venture capitalist or angel investor looking at early-stage startups. Review this project (screenshot and description) as a startup product. Focus on product-market fit, monetization potential, design premiumness, scalability, and market viability. Provide a VC investment review, exactly 3 strengths, exactly 3 weaknesses, exactly 3 improvement suggestions, and a final score from 1 to 10. You must return your response in a raw JSON format matching this schema:
{
  "roast": "your investor-style funny/cynical critique here",
  "review": "your venture capitalist constructive analysis here",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2", "weakness 3"],
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
  "score": 5
}`,
        description: 'Feedback on product-market fit, business model, and startup potential.',
      },
      {
        key: 'Resume Review',
        promptText: `You are an expert technical resume reviewer and developer advocate. Critique this resume. Give a witty, sarcastic resume roast, a resume score from 1 to 100 based on standard industry hiring criteria, and a list of exactly 5 concrete improvement suggestions. You must return your response in a raw JSON format matching this schema:
{
  "roast": "your witty resume roast here",
  "score": 75,
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3", "suggestion 4", "suggestion 5"]
}`,
        description: 'Critique resume text and layout formatting.',
      },
      {
        key: 'Idea Research',
        promptText: `You are an expert market research analyst and startup strategist. Analyze the user's startup idea. You MUST perform web research using search grounding to gather real evidence, actual competitors, similar startups, and real-world failure/success outcomes. Do NOT invent or hallucinate any name, URL, statistic, or outcome.

Return your response in raw JSON format matching this schema:
{
  "startupSummary": "Objective summary of the startup idea.",
  "marketCategory": "e.g. SaaS, B2B, B2C, Marketplace, Consumer, Developer Tool, Fintech, Healthcare, Education, etc.",
  "competitors": {
    "direct": [
      { "name": "Company Name", "website": "https://example.com", "description": "How they compete directly." }
    ],
    "indirect": [
      { "name": "Company Name", "website": "https://example.com", "description": "How they compete indirectly." }
    ],
    "alternatives": [
      { "name": "Alternative Name", "website": "https://example.com", "description": "Non-software or manual workarounds." }
    ]
  },
  "similarStartups": {
    "existing": ["Similar active startup 1", "Similar active startup 2"],
    "acquisitions": ["Acquired similar startup 1", "Acquired similar startup 2"],
    "shutdowns": ["Failed or shutdown similar startup 1", "Failed or shutdown similar startup 2"]
  },
  "whySimilarFailed": [
    "Evidence-backed reason 1 (e.g. timing, CAC, retention) mentioning specific failed startups.",
    "Evidence-backed reason 2..."
  ],
  "whySimilarSucceeded": [
    "Evidence-backed reason 1 (e.g. unique distribution) mentioning specific successful startups.",
    "Evidence-backed reason 2..."
  ],
  "marketOpportunity": {
    "opportunityScore": 85,
    "growthIndicators": ["Industry trend or growth metric 1", "Growth metric 2"],
    "marketMaturity": "Emerging / Growing / Saturated / Mature"
  },
  "customerSegments": {
    "primary": "Primary customer profile.",
    "secondary": "Secondary customer profile.",
    "earlyAdopters": "Ideal first customers."
  },
  "risks": {
    "competition": "Competitive landscape risk description.",
    "regulation": "Regulatory/compliance hurdles.",
    "technicalComplexity": "Technical implementation hurdles.",
    "customerAcquisition": "Customer acquisition difficulty/CAC risk.",
    "aiCommoditization": "Commoditization by AI models.",
    "capitalRequirements": "Capital intensity or funding needs."
  },
  "founderBlindSpots": [
    "Common blind spot 1 (e.g., pricing, compliance, sales cycle length).",
    "Common blind spot 2..."
  ],
  "businessModelSuggestions": ["Recommended model 1 (e.g., subscription, usage-based, marketplace)", "Recommended model 2..."],
  "goToMarketStrategy": ["GTM channel 1 (e.g., SEO, content, partnerships)", "GTM channel 2..."],
  "mvpRoadmap": {
    "week1": "Scope and design specifications for Week 1.",
    "week2": "MVP development and core feature coding for Week 2.",
    "week3": "Testing and initial user onboarding for Week 3.",
    "week4": "Launch preparation and distribution launch for Week 4."
  },
  "investorReview": {
    "vcQuestions": ["Question VCs will ask 1", "Question VCs will ask 2"],
    "fundingRisks": ["Funding risk 1", "Funding risk 2"],
    "defensibilityConcerns": ["Defensibility concern 1", "Defensibility concern 2"]
  },
  "recommendation": {
    "decision": "Build / Pivot / Avoid",
    "reasoning": "Comprehensive logic behind the final recommendation."
  },
  "sources": [
    { "sourceTitle": "Name or title of the source", "sourceUrl": "https://source-url.com", "summary": "Brief summary of evidence used." }
  ]
}`,
        description: 'Comprehensive startup intelligence and market competitor validation report with real-time web search grounding.',
      },
    ]

    for (const prompt of defaultPrompts) {
      try {
        const existing = await payload.find({
          collection: 'prompts',
          where: { key: { equals: prompt.key } },
        })
        if (existing.docs.length === 0) {
          await payload.create({
            collection: 'prompts',
            data: prompt,
          })
          payload.logger.info(`Seeded default prompt: ${prompt.key}`)
        }
      } catch (err: any) {
        payload.logger.error(`Failed to seed prompt ${prompt.key}: ` + err.message)
      }
    }
  },
})
