import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '../../../../../../payload.config'
import { getAuthenticatedUser } from '../../../../../../src/utils/auth'

type Props = {
  params: Promise<{ id: string }>
}

// GET /api/projects/:id - Fetch project and its reviews
export async function GET(req: Request, props: Props) {
  try {
    const { id } = await props.params
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await getPayload({ config })
    const project = await payload.findByID({
      collection: 'projects',
      id: id,
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Verify ownership
    const projectUserId = typeof project.user === 'object' ? project.user.id : project.user
    if (projectUserId.toString() !== user.id.toString()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Fetch associated reviews
    const reviews = await payload.find({
      collection: 'reviews',
      where: {
        project: { equals: project.id }
      }
    })

    return NextResponse.json({
      success: true,
      project,
      reviews: reviews.docs
    })

  } catch (err: any) {
    console.error('Error in GET /api/projects/:id:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}

// DELETE /api/projects/:id - Delete project and reviews
export async function DELETE(req: Request, props: Props) {
  try {
    const { id } = await props.params
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await getPayload({ config })
    const project = await payload.findByID({
      collection: 'projects',
      id: id,
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Verify ownership
    const projectUserId = typeof project.user === 'object' ? project.user.id : project.user
    if (projectUserId.toString() !== user.id.toString()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 1. Delete associated reviews (cascading delete)
    await payload.delete({
      collection: 'reviews',
      where: {
        project: { equals: id }
      }
    })

    // 2. Delete the project itself
    await payload.delete({
      collection: 'projects',
      id: id,
    })

    return NextResponse.json({
      success: true,
      message: 'Project and associated reviews deleted successfully'
    })

  } catch (err: any) {
    console.error('Error in DELETE /api/projects/:id:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
