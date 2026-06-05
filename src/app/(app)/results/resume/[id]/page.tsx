'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import apiClient from '../../../../../utils/apiClient'
import { ChevronLeft, FileText, Download, Award, ShieldAlert, Sparkles, HelpCircle } from 'lucide-react'
import ErrorState from '../../../../../components/ErrorState'
import { PageSkeleton } from '../../../../../components/SkeletonLoader'
import confetti from 'canvas-confetti'

interface ResumeReview {
  id: string
  resumeUrl: string
  roast: string
  suggestions: { suggestion: string }[]
  score: number
}

type Props = {
  params: Promise<{ id: string }>
}

export default function ResumeResultsPage(props: Props) {
  const [id, setId] = useState<string | null>(null)
  const [review, setReview] = useState<ResumeReview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const router = useRouter()

  useEffect(() => {
    props.params.then((p) => {
      setId(p.id)
    })
  }, [props.params])

  useEffect(() => {
    if (id) {
      fetchResumeReview()
    }
  }, [id])

  const fetchResumeReview = async () => {
    if (!id) return
    setLoading(true)
    setError('')
    try {
      const response = await apiClient.get(`/api/reviews/${id}?type=resume`)
      if (response.data.success) {
        setReview(response.data.review)
        
        if (response.data.review.score >= 80) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#ffffff', '#a1a1aa', '#e4e4e7', '#52525b']
          })
        }
      }
    } catch (err: any) {
      console.error('Failed to load resume review:', err)
      setError(err.response?.data?.error || 'Failed to load resume review details.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <PageSkeleton />
  }

  if (error || !review) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4">
        <ErrorState
          title="Resume Review Error"
          description={error || 'Review details could not be found'}
          onRetry={fetchResumeReview}
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
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-200 transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Dashboard
        </Link>
        <span className="rounded bg-zinc-900 border border-zinc-800 px-2.5 py-1 text-xs font-semibold text-zinc-400">
          Gemini ATS Grading
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left Column: Grade Score and Roast Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. Score Card */}
          <div className="border border-zinc-800 bg-zinc-900/40 rounded-xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
            <div className="space-y-1">
              <span className="text-[10px] tracking-wider uppercase text-zinc-500 font-bold">ATS MATCH SCORE</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-5xl font-black text-zinc-100">{review.score}</span>
                <span className="text-xs text-zinc-500 font-medium">/ 100</span>
              </div>
            </div>
            <div className="space-y-1 sm:text-right">
              <span className="text-sm font-semibold text-zinc-200 uppercase tracking-wide">
                {review.score >= 80 ? 'Ready / Competitive' : review.score >= 50 ? 'Revision Required' : 'Critical Issues Detected'}
              </span>
              <p className="text-xs text-zinc-500">
                {review.score >= 80 ? 'Good ATS compatibility' : review.score >= 50 ? 'Fails major keyword parses' : 'Likely automated rejection'}
              </p>
            </div>
          </div>

          {/* 2. Roast Section */}
          <div className="border border-zinc-800 bg-zinc-900/20 rounded-xl p-6 space-y-3">
            <h3 className="text-xs uppercase tracking-wider text-zinc-400 font-bold flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-zinc-400" />
              The Resume Roast
            </h3>
            <p className="text-zinc-300 text-sm leading-relaxed italic bg-zinc-950 border border-zinc-850 p-4 rounded-lg">
              "{review.roast}"
            </p>
          </div>

          {/* 3. Suggestions List */}
          <div className="border border-zinc-800 bg-zinc-900/20 rounded-xl p-6 space-y-4">
            <h3 className="text-xs uppercase tracking-wider text-zinc-400 font-bold">ATS Optimization Suggestions</h3>
            <ul className="space-y-3">
              {review.suggestions.map((item, idx) => (
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

        {/* Right Column: PDF View Link */}
        <div className="space-y-6">
          {/* Original Resume Preview Card */}
          <div className="border border-zinc-800 bg-zinc-900/20 rounded-xl p-6 flex flex-col justify-between items-center text-center space-y-4">
            <FileText className="h-10 w-10 text-zinc-500" />
            <div>
              <h4 className="text-sm font-bold text-zinc-200 mb-1">Your Resume PDF</h4>
              <p className="text-xs text-zinc-500">Stored on Cloudinary secure storage</p>
            </div>
            <a
              href={review.resumeUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-semibold py-2.5 text-xs transition-colors cursor-pointer"
            >
              <Download className="h-4 w-4" />
              Download Resume
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
