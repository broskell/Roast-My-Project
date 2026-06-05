import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '../../../../../../payload.config'
import { getAuthenticatedUser } from '../../../../../../src/utils/auth'

type Props = {
  params: Promise<{ id: string }>
}

export async function GET(req: Request, props: Props) {
  try {
    const { id } = await props.params
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await getPayload({ config })
    const report = await payload.findByID({
      collection: 'idea_reports',
      id: id,
    })

    if (!report) {
      return NextResponse.json({ error: 'Research report not found' }, { status: 404 })
    }

    const createdByUserId = typeof report.createdBy === 'object' ? report.createdBy.id : report.createdBy
    if (createdByUserId.toString() !== user.id.toString()) {
      return NextResponse.json({ error: 'Forbidden: You do not own this research report' }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      report
    })
  } catch (err) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const errorObj = err as any
    console.error('Error in GET /api/idea-research/:id:', errorObj)
    return NextResponse.json({ error: errorObj.message || 'Internal Server Error' }, { status: 500 })
  }
}
