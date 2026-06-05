import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '../../../../../../payload.config'

export async function GET() {
  const status = {
    mongodb: false,
    payload: false,
    geminiKey: false,
    cloudinary: false,
    prompts: false
  }

  try {
    // 1. Initialize Payload & MongoDB Connection
    const payload = await getPayload({ config })
    status.payload = !!payload

    const db = payload.db as unknown as (Record<string, unknown> & { connection?: { readyState?: number } }) | null | undefined
    if (db && db.connection && db.connection.readyState === 1) {
      status.mongodb = true
    }

    // 2. Check Prompts collection readability
    try {
      const promptsResult = await payload.find({
        collection: 'prompts',
        limit: 1
      })
      status.prompts = promptsResult.docs.length > 0
    } catch (err) {
      console.error('[HEALTH-CHECK] Prompts query error:', err)
    }

    // 3. Check Gemini key presence
    const apiKey = process.env.GEMINI_API_KEY
    status.geminiKey = !!apiKey && apiKey.length > 10

    // 4. Check Cloudinary settings
    status.cloudinary = !!(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    )

    return NextResponse.json(status)

  } catch (err: unknown) {
    const errorObj = err as { message?: string } | null | undefined
    console.error('[HEALTH-CHECK] Critical diagnostic error:', err)
    return NextResponse.json({
      ...status,
      criticalError: errorObj?.message || String(err)
    }, { status: 500 })
  }
}
