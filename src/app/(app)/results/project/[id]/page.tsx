'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import apiClient from '../../../../../utils/apiClient'
import {
  Flame,
  Award,
  ChevronLeft,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Link as LinkIcon,
  RefreshCw
} from 'lucide-react'

const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
  </svg>
)

import confetti from 'canvas-confetti'

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
  const [activeTab, setActiveTab] = useState<'roast' | 'technical'>('roast')
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  const router = useRouter()

  useEffect(() => {
    props.params.then((p) => {
      setId(p.id)
    })
  }, [props.params])

  useEffect(() => {
    if (id) {
      fetchProjectDetails()
    }
  }, [id])

  const fetchProjectDetails = async () => {
    if (!id) return
    setLoading(true)
    setError('')
    try {
      const response = await apiClient.get(`/api/projects/${id}`)
      if (response.data.success) {
        setProject(response.data.project)
        setReviews(response.data.reviews)
        
        // If there are reviews, default to the mode of the first review
        if (response.data.reviews.length > 0) {
          setSelectedMode(response.data.reviews[0].mode)
        } else {
          // If no reviews exist, auto-trigger the Funny Roast review
          triggerNewRoast('Funny Roast')
        }
      }
    } catch (err: any) {
      console.error('Failed to load project details:', err)
      setError('Failed to load project details. It may have been deleted.')
    } finally {
      setLoading(false)
    }
  }

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

        // Add to reviews list and update selected mode
        setReviews((prev) => {
          const filtered = prev.filter((r) => r.mode !== mode)
          return [...filtered, newReview]
        })
        setSelectedMode(mode)
        
        // Trigger celebratory confetti for high scores!
        if (newReview.score >= 8) {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.6 },
            colors: ['#a855f7', '#f97316', '#3b82f6']
          })
        }
        
        // Update local project category if returned
        if (project && response.data.review.category) {
          setProject({
            ...project,
            category: response.data.review.category
          })
        }

      }
    } catch (err: any) {
      console.error('AI roast generation failed:', err)
      setError(err.response?.data?.error || 'Failed to generate review. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

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

  // Find review matching current selected mode
  const currentReview = reviews.find((r) => r.mode === selectedMode)

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"></div>
          <p className="text-sm text-purple-300/85">Loading project details...</p>
        </div>
      </div>
    )
  }

  if (error && !project) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center">
        <div className="glass-panel rounded-2xl p-8 border-orange-500/20 text-orange-400">
          <p className="text-base font-semibold mb-4">{error}</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium px-5 py-2.5 transition-colors cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto py-4 px-2 space-y-8">
      {/* Top Header Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-white/50 hover:text-white transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Dashboard
        </Link>
        {project?.category && (
          <span className="rounded-full bg-purple-500/10 border border-purple-500/20 px-3 py-1 text-xs font-semibold text-purple-300">
            Detected: {project.category}
          </span>
        )}
      </div>

      {/* Project Meta Card */}
      {project && (
        <div className="glass-panel rounded-3xl p-6 border-white/5 flex flex-col md:flex-row gap-6 items-start">
          <div className="h-28 w-44 rounded-xl overflow-hidden border border-white/10 shrink-0 relative bg-white/5">
            <img
              src={project.screenshotUrl}
              alt={project.title}
              className="object-cover h-full w-full"
            />
          </div>
          <div className="flex-1 space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
              {project.title}
            </h2>
            <p className="text-sm text-white/60 leading-relaxed max-w-2xl">{project.description}</p>
            <div className="flex items-center gap-4 pt-2">
              {project.githubUrl && (
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs text-white/40 hover:text-purple-400 transition-colors"
                >
                  <GithubIcon className="h-4 w-4" />
                  Repository
                </a>
              )}
              {project.liveUrl && (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs text-white/40 hover:text-purple-400 transition-colors"
                >
                  <LinkIcon className="h-4 w-4" />
                  Live Preview
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Roast Mode Selector Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-white/5">
        {modes.map((mode) => (
          <button
            key={mode}
            disabled={generating}
            onClick={() => handleModeChange(mode)}
            className={`rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              selectedMode === mode
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/15'
                : 'text-white/40 hover:text-white/70 hover:bg-white/5'
            }`}
          >
            {mode}
          </button>
        ))}
      </div>

      {generating ? (
        <div className="glass-panel rounded-3xl p-12 text-center border-white/5 flex flex-col items-center justify-center min-h-[300px]">
          <div className="relative mb-6">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"></div>
            <Flame className="h-6 w-6 text-orange-500 absolute top-5 left-5 animate-pulse" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Gemini is roasting your creation...</h3>
          <p className="text-xs text-white/40 max-w-sm">Uploading context, analyzing designs, and parsing technical criteria. This takes about 4-6 seconds.</p>
        </div>
      ) : error ? (
        <div className="glass-panel rounded-3xl p-8 border-orange-500/20 text-orange-400 flex flex-col items-center gap-4 justify-center min-h-[200px]">
          <AlertTriangle className="h-8 w-8 text-orange-500" />
          <p className="text-sm font-semibold">{error}</p>
          <button
            onClick={() => triggerNewRoast(selectedMode)}
            className="flex items-center gap-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium px-4 py-2 transition-colors cursor-pointer text-xs"
          >
            <RefreshCw className="h-3 w-3" />
            Retry Roast
          </button>
        </div>
      ) : currentReview ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Circular Score & Tabs content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-panel rounded-3xl p-6 border-white/5">
              {/* Tabs */}
              <div className="flex border-b border-white/5 bg-white/2 p-1.5 gap-1 rounded-xl mb-6">
                <button
                  onClick={() => setActiveTab('roast')}
                  className={`flex-1 rounded-lg py-2.5 text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'roast'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  🔥 Read Roast
                </button>
                <button
                  onClick={() => setActiveTab('technical')}
                  className={`flex-1 rounded-lg py-2.5 text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'technical'
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  📋 Technical Review
                </button>
              </div>

              {/* Content Panel */}
              <div className="min-h-[160px]">
                {activeTab === 'roast' ? (
                  <div className="space-y-4">
                    <h4 className="text-xs uppercase tracking-wider text-orange-400 font-bold">The Roast (Mode: {selectedMode})</h4>
                    <p className="text-white/95 text-sm sm:text-base leading-relaxed italic bg-orange-500/5 rounded-2xl border border-orange-500/10 p-5">
                      "{currentReview.roast}"
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h4 className="text-xs uppercase tracking-wider text-purple-400 font-bold">Constructive Technical Feedback</h4>
                    <p className="text-white/75 text-sm sm:text-base leading-relaxed p-2">
                      {currentReview.review}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Suggestions Panel */}
            <div className="glass-panel rounded-3xl p-6 border-white/5">
              <h4 className="text-xs uppercase tracking-wider text-blue-400 font-bold mb-4">Improvement Suggestions</h4>
              <ul className="space-y-3">
                {currentReview.suggestions.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-white/80">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-xs font-bold text-blue-400">
                      {idx + 1}
                    </span>
                    <span>{item.suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Column: Score dial and Strengths / Weaknesses */}
          <div className="space-y-6">
            {/* Score Ring Widget */}
            <div className="glass-panel rounded-3xl p-6 border-white/5 flex flex-col items-center justify-center text-center">
              <span className="text-xs uppercase tracking-wider font-bold text-white/40 mb-4">Gemini Evaluation Score</span>
              
              <div className="relative flex items-center justify-center h-36 w-36 mb-4">
                {/* SVG circular progress ring */}
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="72"
                    cy="72"
                    r="56"
                    className="stroke-white/5 fill-none"
                    strokeWidth="8"
                  />
                  <circle
                    cx="72"
                    cy="72"
                    r="56"
                    className={`fill-none transition-all duration-1000 ${
                      currentReview.score >= 8 
                        ? 'stroke-green-400' 
                        : currentReview.score >= 5 
                          ? 'stroke-orange-400' 
                          : 'stroke-red-400'
                    }`}
                    strokeWidth="8"
                    strokeDasharray="351.8"
                    strokeDashoffset={351.8 - (351.8 * currentReview.score) / 10}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-4xl font-extrabold text-white leading-none">{currentReview.score}</span>
                  <span className="text-[10px] text-white/40 uppercase tracking-widest mt-1">/ 10</span>
                </div>
              </div>
              
              <span className={`text-sm font-extrabold uppercase tracking-widest ${
                currentReview.score >= 8 ? 'text-green-400' : currentReview.score >= 5 ? 'text-orange-400' : 'text-red-400'
              }`}>
                {currentReview.score >= 8 ? 'Exceptional Work' : currentReview.score >= 5 ? 'Needs Polish' : 'Absolute Disaster'}
              </span>
            </div>

            {/* Strengths & Weaknesses Stack */}
            <div className="glass-panel rounded-3xl p-6 border-white/5 space-y-6">
              <div>
                <h4 className="text-xs uppercase tracking-wider text-green-400 font-bold mb-3 flex items-center gap-1.5">
                  <Award className="h-4 w-4" />
                  Key Strengths
                </h4>
                <ul className="space-y-2 text-xs text-white/70">
                  {currentReview.strengths.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-green-400 font-bold">•</span>
                      <span>{item.strength}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-4 border-t border-white/5">
                <h4 className="text-xs uppercase tracking-wider text-red-400 font-bold mb-3 flex items-center gap-1.5">
                  <Flame className="h-4 w-4" />
                  Core Weaknesses
                </h4>
                <ul className="space-y-2 text-xs text-white/70">
                  {currentReview.weaknesses.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-red-400 font-bold">•</span>
                      <span>{item.weakness}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 glass-panel rounded-3xl border-white/5">
          <p className="text-white/40 text-sm">No review generated for this mode.</p>
        </div>
      )}
    </div>
  )
}
