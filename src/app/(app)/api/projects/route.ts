import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '../../../../../payload.config'
import { getAuthenticatedUser } from '../../../../../src/utils/auth'

// GET /api/projects - Fetch all projects for the logged-in user
export async function GET(req: Request) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await getPayload({ config })
    const projects = await payload.find({
      collection: 'projects',
      where: {
        user: { equals: user.id }
      },
      sort: '-createdAt',
      limit: 100
    })

    return NextResponse.json({
      success: true,
      projects: projects.docs
    })

  } catch (err: any) {
    console.error('Error in GET /api/projects:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}

// POST /api/projects - Submit a new project
export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title, description, screenshotUrl, screenshotPublicId, githubUrl, liveUrl } = await req.json()
    if (!title || !description || !screenshotUrl) {
      return NextResponse.json({ error: 'Title, Description, and Screenshot URL are required' }, { status: 400 })
    }

    const payload = await getPayload({ config })

    const project = await payload.create({
      collection: 'projects',
      data: {
        title,
        description,
        screenshotUrl,
        screenshotPublicId: screenshotPublicId || '',
        githubUrl: githubUrl || '',
        liveUrl: liveUrl || '',
        category: 'Other', // default, Gemini will update it upon roast
        user: user.id,
      }
    })

    return NextResponse.json({
      success: true,
      project
    })

  } catch (err: any) {
    console.error('Error in POST /api/projects:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
