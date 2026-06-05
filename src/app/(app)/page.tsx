'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Sparkles, Terminal, ShieldAlert, Award, FileText } from 'lucide-react'

export default function LandingPage() {
  const [selectedMockMode, setSelectedMockMode] = useState('Funny Roast')

  const mockReviews: Record<string, { score: number; roast: string; review: string }> = {
    'Funny Roast': {
      score: 4,
      roast: "Oh look, another MERN stack clone. Did you use an online tutorial, or did you write this while sleeping? That button hover animation is so slow it gave me time to reconsider my life choices. Mongoose relationship schema is cleaner than the UI, which is saying something.",
      review: "A classic full-stack implementation with standard architecture. The front-end styling is overly default and elements could use spacing. Consider adding pagination to the lists and optimizing bundle size."
    },
    'Brutal Roast': {
      score: 2,
      roast: "This UI looks like a 2012 bootstrap site that fell down the stairs. The 'glassmorphic' cards look more like dirty windows. Why is there a delete button without confirmation? Do you hate your database, or just your users?",
      review: "Critical UX issues. Immediate implementation of confirmation modals for destructive actions is needed. Align margins globally and use consistent padding values."
    },
    'Senior Developer Review': {
      score: 6,
      roast: "Solid start, but storing OTP codes in plaintext and doing API calls without catch blocks is a classic junior mistake. Also, why is the landing page bundle 1.2MB? Get rid of unused libraries.",
      review: "Good MERN foundation. Implement API error handling, replace temporary local states with context, add validation schemas (e.g. Zod) for backend inputs, and compress media assets."
    }
  }

  return (
    <div className="flex flex-col items-center justify-center py-12">
      {/* Hero Section */}
      <section className="text-center max-w-4xl mx-auto mb-16 px-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm font-medium mb-6">
          <Sparkles className="h-4 w-4 text-zinc-400" />
          <span>Vercel-compatible serverless AI roasting</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6 leading-tight text-white">
          Get Actionable AI Feedback <br />
          <span className="text-zinc-400">on Your Code & Resume</span>
        </h1>
        <p className="text-lg sm:text-xl text-zinc-400 mb-8 max-w-2xl mx-auto">
          Upload a project and receive AI-powered reviews from multiple perspectives.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/submit"
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-zinc-100 px-8 py-4 text-base font-semibold text-zinc-950 hover:bg-zinc-200 transition-all cursor-pointer"
          >
            Roast My Project
            <ArrowRight className="h-5 w-5" />
          </Link>
          <Link
            href="/resume"
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-zinc-900 border border-zinc-800 px-8 py-4 text-base font-semibold text-zinc-100 hover:bg-zinc-800 transition-all cursor-pointer"
          >
            <FileText className="h-5 w-5 text-zinc-400" />
            Analyze Resume PDF
          </Link>
        </div>
      </section>

      {/* Feature Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-20 px-4">
        <div className="glass-panel rounded-2xl p-6 relative overflow-hidden group">
          <Terminal className="h-10 w-10 text-zinc-400 mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">5 Review Modes</h3>
          <p className="text-sm text-zinc-400">
            Toggle between Funny, Brutal, Recruiter, Senior Architect, and VC Investor perspectives.
          </p>
        </div>
        <div className="glass-panel rounded-2xl p-6 relative overflow-hidden group">
          <Sparkles className="h-10 w-10 text-zinc-400 mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Multimodal Gemini AI</h3>
          <p className="text-sm text-zinc-400">
            Gemini reads your project screenshot, auto-detects its category, and reads PDF resume texts.
          </p>
        </div>
        <div className="glass-panel rounded-2xl p-6 relative overflow-hidden group">
          <Award className="h-10 w-10 text-zinc-400 mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Payload CMS 3.x Admin</h3>
          <p className="text-sm text-zinc-400">
            An admin portal to edit prompt templates on the fly, moderate projects, and view analytics.
          </p>
        </div>
      </section>

      {/* Interactive Mock Review Section */}
      <section className="w-full max-w-4xl mx-auto px-4 mb-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-3 text-white">Get actionable feedback for your projects</h2>
          <p className="text-sm text-zinc-500">Select a review mode below to preview a sample analysis output</p>
        </div>

        <div className="glass-panel rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl">
          {/* Tabs */}
          <div className="flex border-b border-zinc-800 bg-zinc-950 p-2 gap-1 overflow-x-auto">
            {Object.keys(mockReviews).map((mode) => (
              <button
                key={mode}
                onClick={() => setSelectedMockMode(mode)}
                className={`rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  selectedMockMode === mode
                    ? 'bg-zinc-100 text-zinc-950 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6 sm:p-8 flex flex-col md:flex-row gap-8 items-stretch">
            <div className="flex flex-col items-start gap-1 justify-center w-full md:w-1/4 border-b md:border-b-0 md:border-r border-zinc-800 pb-6 md:pb-0 md:pr-6">
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">PROJECT SCORE</span>
              <span className="text-5xl font-extrabold text-zinc-100 leading-none my-1">{mockReviews[selectedMockMode].score}.0</span>
              <span className="text-xs font-semibold text-zinc-300">
                {mockReviews[selectedMockMode].score >= 8 ? 'Outstanding' : mockReviews[selectedMockMode].score >= 5 ? 'Strong performance' : 'Requires review'}
              </span>
              <span className="text-[10px] text-zinc-500 mt-1">
                {mockReviews[selectedMockMode].score >= 8 ? 'Top 10% of projects' : mockReviews[selectedMockMode].score >= 5 ? 'Top 35% of projects' : 'Below average'}
              </span>
            </div>

            <div className="flex-1 flex flex-col gap-4">
              <div>
                <h4 className="text-xs uppercase tracking-wider text-zinc-400 font-bold mb-1.5">The Roast</h4>
                <p className="text-zinc-300 text-sm leading-relaxed italic bg-zinc-950 border border-zinc-800 rounded-xl p-4">
                  "{mockReviews[selectedMockMode].roast}"
                </p>
              </div>
              <div>
                <h4 className="text-xs uppercase tracking-wider text-zinc-400 font-bold mb-1.5">Technical Review</h4>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  {mockReviews[selectedMockMode].review}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
