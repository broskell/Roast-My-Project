import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '../../../../../../payload.config'
import { getAuthenticatedUser } from '../../../../../utils/auth'

export async function GET(req: Request) {
  try {
    const user = await getAuthenticatedUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await getPayload({ config })

    // 1. Fetch user's projects
    const projects = await payload.find({
      collection: 'projects',
      where: {
        user: { equals: user.id }
      },
      limit: 200
    })

    const projectIds = projects.docs.map(p => p.id)
    
    if (projectIds.length === 0) {
      return NextResponse.json({
        success: true,
        stats: {
          totalProjects: 0,
          totalReviews: 0,
          averageScore: 0,
          highestScoringProject: null,
          lowestScoringProject: null,
          recentReviews: [],
          reviewHistory: []
        }
      })
    }

    // 2. Fetch all reviews for these projects
    const reviews = await payload.find({
      collection: 'reviews',
      where: {
        project: { in: projectIds }
      },
      sort: '-createdAt',
      limit: 100
    })

    const docs = reviews.docs
    const totalReviews = docs.length
    
    let averageScore = 0
    let highestScoringProject = null
    let lowestScoringProject = null
    const reviewHistory: any[] = []

    if (totalReviews > 0) {
      let sum = 0
      let maxScore = -1
      let minScore = 11

      for (const review of docs) {
        sum += review.score
        
        // Find matching project
        const projectObj = projects.docs.find(p => p.id === (typeof review.project === 'object' ? review.project.id : review.project))
        const projectTitle = projectObj?.title || 'Unknown Project'

        // Check Max
        if (review.score > maxScore) {
          maxScore = review.score
          highestScoringProject = {
            id: review.id,
            projectId: projectObj?.id || '',
            title: projectTitle,
            score: review.score,
            mode: review.mode
          }
        }

        // Check Min
        if (review.score < minScore) {
          minScore = review.score
          lowestScoringProject = {
            id: review.id,
            projectId: projectObj?.id || '',
            title: projectTitle,
            score: review.score,
            mode: review.mode
          }
        }

        // Format history for Recharts
        const formattedDate = new Date(review.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        })
        
        reviewHistory.push({
          id: review.id,
          project: projectTitle,
          score: review.score,
          mode: review.mode,
          date: formattedDate,
          timestamp: new Date(review.createdAt).getTime()
        })
      }

      averageScore = Number((sum / totalReviews).toFixed(1))
    }

    // Sort reviewHistory chronologically for charts
    reviewHistory.sort((a, b) => a.timestamp - b.timestamp)

    // Format recent reviews (limit 5) with project relationship details
    const recentReviews = docs.slice(0, 5).map(review => {
      const projectObj = projects.docs.find(p => p.id === (typeof review.project === 'object' ? review.project.id : review.project))
      return {
        id: review.id,
        score: review.score,
        mode: review.mode,
        createdAt: review.createdAt,
        roast: review.roast.substring(0, 120) + '...',
        project: projectObj ? {
          id: projectObj.id,
          title: projectObj.title,
          screenshotUrl: projectObj.screenshotUrl,
          category: projectObj.category
        } : null
      }
    })

    return NextResponse.json({
      success: true,
      stats: {
        totalProjects: projects.docs.length,
        totalReviews,
        averageScore,
        highestScoringProject,
        lowestScoringProject,
        recentReviews,
        reviewHistory // Recharts data
      }
    })

  } catch (err: any) {
    console.error('Error in GET /api/dashboard/stats:', err)
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 })
  }
}
