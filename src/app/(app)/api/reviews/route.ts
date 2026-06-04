import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '../../../../../payload.config'
import { getAuthenticatedUser } from '../../../../../src/utils/auth'

// GET /api/reviews - Fetch all reviews for projects owned by the user
export async function GET(req: Request) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await getPayload({ config })

    // Find all projects owned by the user
    const projects = await payload.find({
      collection: 'projects',
      where: {
        user: { equals: user.id }
      },
      limit: 200
    })

    const projectIds = projects.docs.map((p) => p.id)
    if (projectIds.length === 0) {
      return NextResponse.json({ success: true, reviews: [] })
    }

    // Find reviews for these projects
    const reviews = await payload.find({
      collection: 'reviews',
      where: {
        project: { in: projectIds }
      },
      sort: '-createdAt',
      limit: 100
    })

    return NextResponse.json({
      success: true,
      reviews: reviews.docs
    })

  } catch (err: any) {
    console.error('Error in GET /api/reviews:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
