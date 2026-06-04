'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import apiClient from '../../../../../utils/apiClient'
import { ChevronLeft, FileText, Download, Award, ShieldAlert, Sparkles, HelpCircle } from 'lucide-react'
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
      // Direct database query for specific resume document
      const response = await apiClient.get(`/api/reviews/${id}?type=resume`)
      if (response.data.success) {
        // The API returns the review or resume review matching the query
        setReview(response.data.review)
        
        // Trigger celebratory confetti for high scores!
        if (response.data.review.score >= 80) {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#a855f7', '#f97316', '#10b981']
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
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"></div>
          <p className="text-sm text-purple-300/85">Analyzing resume critique...</p>
        </div>
      </div>
    )
  }

  if (error || !review) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center">
        <div className="glass-panel rounded-2xl p-8 border-orange-500/20 text-orange-400">
          <p className="text-base font-semibold mb-4">{error || 'Review not found'}</p>
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
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-white/50 hover:text-white transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
          Dashboard
        </Link>
        <span className="rounded-full bg-purple-500/10 border border-purple-500/20 px-3 py-1 text-xs font-semibold text-purple-300">
          Gemini ATS Grading
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Grade Score and Roast Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Sarcastic Roast */}
          <div className="glass-panel rounded-3xl p-6 border-white/5 space-y-4">
            <h3 className="text-xs uppercase tracking-wider text-orange-400 font-bold flex items-center gap-1.5">
              <Sparkles className="h-4 w-4" />
              The Resume Roast
            </h3>
            <p className="text-white/95 text-sm sm:text-base leading-relaxed italic bg-orange-500/5 rounded-2xl border border-orange-500/10 p-5">
              "{review.roast}"
            </p>
          </div>

          {/* Suggestions List */}
          <div className="glass-panel rounded-3xl p-6 border-white/5">
            <h3 className="text-xs uppercase tracking-wider text-blue-400 font-bold mb-4">ATS Optimization Suggestions</h3>
            <ul className="space-y-3.5">
              {review.suggestions.map((item, idx) => (
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

        {/* Right Column: Score dial and PDF View Link */}
        <div className="space-y-6">
          {/* Score ring */}
          <div className="glass-panel rounded-3xl p-6 border-white/5 flex flex-col items-center justify-center text-center">
            <span className="text-xs uppercase tracking-wider font-bold text-white/40 mb-4">ATS Match Score</span>
            
            <div className="relative flex items-center justify-center h-36 w-36 mb-4">
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
                    review.score >= 80 
                      ? 'stroke-green-400' 
                      : review.score >= 50 
                        ? 'stroke-orange-400' 
                        : 'stroke-red-400'
                  }`}
                  strokeWidth="8"
                  strokeDasharray="351.8"
                  strokeDashoffset={351.8 - (351.8 * review.score) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-4xl font-extrabold text-white leading-none">{review.score}</span>
                <span className="text-[10px] text-white/40 uppercase tracking-widest mt-1">/ 100</span>
              </div>
            </div>
            
            <span className={`text-xs sm:text-sm font-extrabold uppercase tracking-widest ${
              review.score >= 80 ? 'text-green-400' : review.score >= 50 ? 'text-orange-400' : 'text-red-400'
            }`}>
              {review.score >= 80 ? 'Hirable / Ready' : review.score >= 50 ? 'Needs Major Revision' : 'Rejection Incoming'}
            </span>
          </div>

          {/* Original Resume Preview Card */}
          <div className="glass-panel rounded-3xl p-6 border-white/5 flex flex-col justify-between items-center text-center space-y-4">
            <FileText className="h-10 w-10 text-white/30" />
            <div>
              <h4 className="text-sm font-bold text-white mb-1">Your Resume PDF</h4>
              <p className="text-xs text-white/40">Stored securely on Cloudinary storage</p>
            </div>
            <a
              href={review.resumeUrl}
              target="_blank"
              rel="noreferrer"
              className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 text-xs transition-colors cursor-pointer"
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
