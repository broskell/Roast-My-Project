'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import apiClient from '../../../../../utils/apiClient'
import {
  Flame,
  Award,
  ChevronLeft,
  AlertTriangle,
  Link as LinkIcon
} from 'lucide-react'
import ErrorState from '../../../../../components/ErrorState'
import { PageSkeleton } from '../../../../../components/SkeletonLoader'
import confetti from 'canvas-confetti'

const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
)

interface Review {
  id: string
  roast: string
  review: string
  strengths: { strength: string }[]
  weaknesses: { weakness: string }[]
  suggestions: { suggestion: string }[]
  score: number
  mode: string
}

interface Project {
  id: string
  title: string
  description: string
  screenshotUrl: string
  githubUrl: string
  liveUrl: string
  category: string
}

type Props = {
  params: Promise<{ id: string }>
}

export default function ProjectResultsPage(props: Props) {
  const [id, setId] = useState<string | null>(null)
  const [project, setProject] = useState<Project | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  
  // UI States
  const [selectedMode, setSelectedMode] = useState('Funny Roast')
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    props.params.then((p) => {
      setId(p.id)
    })
  }, [props.params])

  const triggerNewRoast = async (mode: string) => {
    if (!id) return
    setGenerating(true)
    setError('')
    try {
      const response = await apiClient.post('/api/ai/roast', {
        projectId: id,
        mode
      })

      if (response.data.success) {
        const newReview: Review = {
          id: response.data.review.id,
          roast: response.data.review.roast,
          review: response.data.review.review,
          strengths: response.data.review.strengths.map((s: string) => ({ strength: s })),
          weaknesses: response.data.review.weaknesses.map((w: string) => ({ weakness: w })),
          suggestions: response.data.review.suggestions.map((s: string) => ({ suggestion: s })),
          score: response.data.review.score,
          mode: response.data.review.mode
        }

        setReviews((prev) => {
          const filtered = prev.filter((r) => r.mode !== mode)
          return [...filtered, newReview]
        })
        setSelectedMode(mode)
        
        if (newReview.score >= 8) {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.6 },
            colors: ['#ffffff', '#a1a1aa', '#e4e4e7', '#52525b']
          })
        }
        
        if (project && response.data.review.category) {
          setProject({
            ...project,
            category: response.data.review.category
          })
        }

      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { stage?: string; error?: string; requestId?: string } } } | null | undefined
      console.error('[ROAST-CLIENT]', errorObj?.response?.data)
      const errorData = errorObj?.response?.data
      if (errorData?.stage) {
        setError(`Request ID: ${errorData.requestId || 'N/A'}\nStage: ${errorData.stage}\nError: ${errorData.error}`)
      } else {
        const standardError = err as { message?: string } | null | undefined
        setError(errorData?.error || standardError?.message || 'Failed to generate review. Please try again.')
      }
    } finally {
      setGenerating(false)
    }
  }

  const fetchProjectDetails = async () => {
    if (!id) return
    setLoading(true)
    setError('')
    try {
      const response = await apiClient.get(`/api/projects/${id}`)
      if (response.data.success) {
        setProject(response.data.project)
        setReviews(response.data.reviews)
        
        if (response.data.reviews.length > 0) {
          setSelectedMode(response.data.reviews[0].mode)
        } else {
          triggerNewRoast('Funny Roast')
        }
      }
    } catch (err: unknown) {
      console.error('Failed to load project details:', err)
      setError('Failed to load project details. It may have been deleted.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      const timer = setTimeout(() => {
        fetchProjectDetails()
      }, 0)
      return () => clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const handleModeChange = (mode: string) => {
    setSelectedMode(mode)
    const existing = reviews.find((r) => r.mode === mode)
    if (!existing) {
      triggerNewRoast(mode)
    }
  }

  const modes = [
    'Funny Roast',
    'Brutal Roast',
    'Recruiter Review',
    'Senior Developer Review',
    'Investor Review'
  ]

  const currentReview = reviews.find((r) => r.mode === selectedMode)

  if (loading) {
    return <PageSkeleton />
  }

  if (error && !project) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4">
        <ErrorState
          title="Project Load Error"
          description={error}
          onRetry={fetchProjectDetails}
        />
        <div className="mt-6 text-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-300 font-semibold px-5 py-2.5 transition-colors cursor-pointer text-xs"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-4 px-2 space-y-8">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-200 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Dashboard
        </Link>
        {project?.category && (
          <span className="rounded bg-zinc-900 border border-zinc-800 px-2.5 py-1 text-xs font-semibold text-zinc-400">
            Category: {project.category}
          </span>
        )}
      </div>

      {/* Roast Mode Selector Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-zinc-800">
        {modes.map((mode) => (
          <button
            key={mode}
            disabled={generating}
            onClick={() => handleModeChange(mode)}
            className={`rounded-xl px-4 py-2.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              selectedMode === mode
                ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-900/50'
            }`}
          >
            {mode}
          </button>
        ))}
      </div>

      {generating ? (
        <div className="border border-zinc-800 bg-zinc-900/40 rounded-2xl p-12 text-center flex flex-col items-center justify-center min-h-[300px] animate-pulse">
          <div className="relative mb-6">
            <div className="h-12 w-12 rounded-full border-4 border-zinc-800 border-t-zinc-100 animate-spin"></div>
            <Flame className="h-5 w-5 text-zinc-400 absolute top-3.5 left-3.5 animate-pulse" />
          </div>
          <h3 className="text-sm font-semibold text-zinc-200 mb-1">Analyzing project artifacts...</h3>
          <p className="text-xs text-zinc-500 max-w-sm">Running visual design checks and code structure analysis. This takes 4-6 seconds.</p>
        </div>
      ) : error ? (
        <div className="py-8">
          <ErrorState
            title="Analysis Generation Failed"
            description={error}
            onRetry={() => triggerNewRoast(selectedMode)}
            retryLabel="Retry Review"
          />
        </div>
      ) : currentReview ? (
        <div className="space-y-6">
          {/* 1. Score Card */}
          <div className="border border-zinc-800 bg-zinc-900/40 rounded-xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
            <div className="space-y-1">
              <span className="text-[10px] tracking-wider uppercase text-zinc-500 font-bold">PROJECT SCORE</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-5xl font-black text-zinc-100">{currentReview.score}.0</span>
                <span className="text-xs text-zinc-500 font-medium">/ 10</span>
              </div>
            </div>
            <div className="space-y-1 md:text-right">
              <span className="text-sm font-semibold text-zinc-200 uppercase tracking-wide">
                {currentReview.score >= 8 ? 'Exceptional Work' : currentReview.score >= 5 ? 'Needs Polish' : 'Significant Issues'}
              </span>
              <p className="text-xs text-zinc-500">
                {currentReview.score >= 8 ? 'Top 10% of reviewed projects' : currentReview.score >= 5 ? 'Top 35% of reviewed projects' : 'Requires substantial revisions'}
              </p>
            </div>
          </div>

          {/* 2. Summary Card */}
          {project && (
            <div className="border border-zinc-800 bg-zinc-900/20 rounded-xl p-6">
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <div className="h-28 w-44 rounded-lg overflow-hidden border border-zinc-800 shrink-0 relative bg-zinc-900 bg-zinc-950/40">
                  <img
                    src={project.screenshotUrl}
                    alt={project.title}
                    className="object-cover h-full w-full"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <h2 className="text-xl font-bold text-zinc-100 leading-tight">
                    {project.title}
                  </h2>
                  <p className="text-xs text-zinc-400 leading-relaxed max-w-2xl">{project.description}</p>
                  <div className="flex items-center gap-4 pt-2">
                    {project.githubUrl && (
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white transition-colors"
                      >
                        <GithubIcon className="h-4 w-4 text-zinc-500" />
                        Repository
                      </a>
                    )}
                    {project.liveUrl && (
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white transition-colors"
                      >
                        <LinkIcon className="h-4 w-4 text-zinc-500" />
                        Live Preview
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 3. Roast Section */}
          <div className="border border-zinc-800 bg-zinc-900/20 rounded-xl p-6 space-y-3">
            <h3 className="text-xs uppercase tracking-wider text-zinc-400 font-bold">The Roast</h3>
            <p className="text-zinc-300 text-sm leading-relaxed italic bg-zinc-950 border border-zinc-850 p-4 rounded-lg">
              &ldquo;{currentReview.roast}&rdquo;
            </p>
          </div>

          {/* 4. Technical Review Section */}
          <div className="border border-zinc-800 bg-zinc-900/20 rounded-xl p-6 space-y-3">
            <h3 className="text-xs uppercase tracking-wider text-zinc-400 font-bold">Technical Review</h3>
            <p className="text-zinc-400 text-sm leading-relaxed whitespace-pre-line">
              {currentReview.review}
            </p>
          </div>

          {/* 5. Strengths Section */}
          <div className="border border-zinc-800 bg-zinc-900/20 rounded-xl p-6 space-y-3">
            <h3 className="text-xs uppercase tracking-wider text-zinc-400 font-bold flex items-center gap-1.5">
              <Award className="h-4 w-4 text-zinc-400" />
              Key Strengths
            </h3>
            <ul className="space-y-2 text-xs text-zinc-400">
              {currentReview.strengths.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-zinc-500 font-bold">•</span>
                  <span>{item.strength}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 6. Weaknesses Section */}
          <div className="border border-zinc-800 bg-zinc-900/20 rounded-xl p-6 space-y-3">
            <h3 className="text-xs uppercase tracking-wider text-zinc-400 font-bold flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-zinc-400" />
              Core Weaknesses
            </h3>
            <ul className="space-y-2 text-xs text-zinc-400">
              {currentReview.weaknesses.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-zinc-500 font-bold">•</span>
                  <span>{item.weakness}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 7. Suggestions Section */}
          <div className="border border-zinc-800 bg-zinc-900/20 rounded-xl p-6 space-y-4">
            <h3 className="text-xs uppercase tracking-wider text-zinc-400 font-bold">Improvement Suggestions</h3>
            <ul className="space-y-3">
              {currentReview.suggestions.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3.5 text-sm text-zinc-300">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-900 border border-zinc-850 text-xs font-bold text-zinc-400">
                    {idx + 1}
                  </span>
                  <span>{item.suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 border border-zinc-800 bg-zinc-900/10 rounded-xl">
          <p className="text-zinc-500 text-xs">No review generated for this mode.</p>
        </div>
      )}
    </div>
  )
}
