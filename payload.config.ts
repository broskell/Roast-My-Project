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
