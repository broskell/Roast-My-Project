import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '../../../../../../payload.config'

export async function GET(req: Request) {
  try {
    const payload = await getPayload({ config })

    // Count all users
    const users = await payload.find({
      collection: 'users',
      limit: 1, // only need totalDocs
    })

    // Count all projects
    const projects = await payload.find({
      collection: 'projects',
      limit: 1,
    })

    // Count all reviews
    const reviews = await payload.find({
      collection: 'reviews',
      limit: 1,
    })

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers: users.totalDocs,
        totalProjects: projects.totalDocs,
        totalReviews: reviews.totalDocs,
      }
    })

  } catch (err: any) {
    console.error('Error in GET /api/admin/stats:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
export const dynamic = 'force-dynamic'
