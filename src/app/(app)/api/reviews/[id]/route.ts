import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '../../../../../../payload.config'
import { getAuthenticatedUser } from '../../../../../../src/utils/auth'

type Props = {
  params: Promise<{ id: string }>
}

// GET /api/reviews/:id - Get a specific review
export async function GET(req: Request, props: Props) {
  try {
    const { id } = await props.params
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await getPayload({ config })
    const url = new URL(req.url)
    const isResume = url.searchParams.get('type') === 'resume'

    if (isResume) {
      const resumeReview = await payload.findByID({
        collection: 'resumes',
        id: id,
      })

      if (!resumeReview) {
        return NextResponse.json({ error: 'Resume review not found' }, { status: 404 })
      }

      // Verify resume ownership
      const resumeUserId = typeof resumeReview.user === 'object' ? resumeReview.user.id : resumeReview.user
      if (resumeUserId.toString() !== user.id.toString()) {
        return NextResponse.json({ error: 'Forbidden: You do not own this resume review' }, { status: 403 })
      }

      return NextResponse.json({
        success: true,
        review: resumeReview
      })
    }

    const review = await payload.findByID({
      collection: 'reviews',
      id: id,
    })

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    // Verify project ownership
    const project = typeof review.project === 'object' ? review.project : await payload.findByID({
      collection: 'projects',
      id: String(review.project),
    })

    if (!project) {
      return NextResponse.json({ error: 'Associated project not found' }, { status: 404 })
    }

    const projectUserId = typeof project.user === 'object' ? project.user.id : project.user
    if (projectUserId.toString() !== user.id.toString()) {
      return NextResponse.json({ error: 'Forbidden: You do not own the project for this review' }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      review
    })

  } catch (err: any) {
    console.error('Error in GET /api/reviews/:id:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}

// DELETE /api/reviews/:id - Delete a specific review
export async function DELETE(req: Request, props: Props) {
  try {
    const { id } = await props.params
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await getPayload({ config })
    const url = new URL(req.url)
    const isResume = url.searchParams.get('type') === 'resume'

    if (isResume) {
      const resumeReview = await payload.findByID({
        collection: 'resumes',
        id: id,
      })

      if (!resumeReview) {
        return NextResponse.json({ error: 'Resume review not found' }, { status: 404 })
      }

      // Verify resume ownership
      const resumeUserId = typeof resumeReview.user === 'object' ? resumeReview.user.id : resumeReview.user
      if (resumeUserId.toString() !== user.id.toString()) {
        return NextResponse.json({ error: 'Forbidden: You do not own this resume review' }, { status: 403 })
      }

      await payload.delete({
        collection: 'resumes',
        id: id,
      })

      return NextResponse.json({
        success: true,
        message: 'Resume review deleted successfully'
      })
    }

    const review = await payload.findByID({
      collection: 'reviews',
      id: id,
    })

    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    // Verify project ownership
    const project = typeof review.project === 'object' ? review.project : await payload.findByID({
      collection: 'projects',
      id: String(review.project),
    })

    if (!project) {
      return NextResponse.json({ error: 'Associated project not found' }, { status: 404 })
    }

    const projectUserId = typeof project.user === 'object' ? project.user.id : project.user
    if (projectUserId.toString() !== user.id.toString()) {
      return NextResponse.json({ error: 'Forbidden: You do not own the project for this review' }, { status: 403 })
    }

    // Delete the review
    await payload.delete({
      collection: 'reviews',
      id: id,
    })

    return NextResponse.json({
      success: true,
      message: 'Review deleted successfully'
    })

  } catch (err: any) {
    console.error('Error in DELETE /api/reviews/:id:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
