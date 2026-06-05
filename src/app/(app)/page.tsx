'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Terminal, FileText, Search, TrendingUp, Flame } from 'lucide-react'

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
    <div className="flex flex-col items-center justify-center py-20 sm:py-28 space-y-24 max-w-6xl mx-auto px-4 sm:px-6">
      
      {/* Hero Section */}
      <section className="text-center space-y-10 max-w-3xl mx-auto mt-4">
        <div className="space-y-6">
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight opacity-0 animate-fade-in-up">
            Get Actionable AI Feedback <br />
            <span className="text-zinc-500">on Your Code & Resume</span>
          </h1>
          <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed opacity-0 animate-fade-in-up animation-delay-100">
            Upload your project or resume for critical multi-perspective reviews, or validate your startup concepts with search-grounded market intelligence.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6 opacity-0 animate-fade-in-up animation-delay-200">
          <Link
            href="/submit"
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-zinc-100 px-8 py-4 text-base font-semibold text-zinc-950 hover:bg-zinc-200 transition-all cursor-pointer shadow-sm"
          >
            <Flame className="h-5 w-5 text-zinc-950" />
            Roast My Project
          </Link>
          <Link
            href="/resume"
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-zinc-900 border border-zinc-800 px-8 py-4 text-base font-semibold text-zinc-100 hover:bg-zinc-800 transition-all cursor-pointer"
          >
            <FileText className="h-5 w-5 text-zinc-400" />
            Roast Resume
          </Link>
          <Link
            href="/idea-research"
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-zinc-900 border border-zinc-800 px-8 py-4 text-base font-semibold text-zinc-100 hover:bg-zinc-800 transition-all cursor-pointer"
          >
            <Search className="h-5 w-5 text-zinc-400" />
            Idea Research
          </Link>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
        {/* 1. Idea Intelligence */}
        <div className="bg-zinc-900/30 border border-zinc-800 hover:border-zinc-600 rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between group min-h-[180px]">
          <div className="space-y-4">
            <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl w-fit text-zinc-400 group-hover:text-zinc-100 transition-colors">
              <Search className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Idea Intelligence</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Validate startup concepts, identify direct/indirect competitors, and explore business viability.
              </p>
            </div>
          </div>
        </div>

        {/* 2. Project Review */}
        <div className="bg-zinc-900/30 border border-zinc-800 hover:border-zinc-600 rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between group min-h-[180px]">
          <div className="space-y-4">
            <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl w-fit text-zinc-400 group-hover:text-zinc-100 transition-colors">
              <Terminal className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Project Review</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Get critical technical audits, design critiques, and UX feedback from multiple custom perspectives.
              </p>
            </div>
          </div>
        </div>

        {/* 3. Resume Review */}
        <div className="bg-zinc-900/30 border border-zinc-800 hover:border-zinc-600 rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between group min-h-[180px]">
          <div className="space-y-4">
            <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl w-fit text-zinc-400 group-hover:text-zinc-100 transition-colors">
              <FileText className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Resume Review</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Optimize your professional profile with deep ATS-focused keyphrase checks and formatting recommendations.
              </p>
            </div>
          </div>
        </div>

        {/* 4. Market Research */}
        <div className="bg-zinc-900/30 border border-zinc-800 hover:border-zinc-600 rounded-2xl p-6 transition-all duration-300 flex flex-col justify-between group min-h-[180px]">
          <div className="space-y-4">
            <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl w-fit text-zinc-400 group-hover:text-zinc-100 transition-colors">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Market Research</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Ground your planning with real-world data, failure reasons, success factors, and opportunity sizing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Mock Review Section */}
      <section className="w-full space-y-6">
        <div className="text-center space-y-1.5">
          <h2 className="text-2xl font-bold text-white">Actionable Feedback for Builders</h2>
          <p className="text-sm text-zinc-500">Preview a sample evaluation output by selecting a review perspective</p>
        </div>

        <div className="border border-zinc-800 bg-zinc-900/20 rounded-2xl overflow-hidden shadow-sm">
          {/* Tabs */}
          <div className="flex border-b border-zinc-800 bg-zinc-950/80 p-2 gap-1 overflow-x-auto">
            {Object.keys(mockReviews).map((mode) => (
              <button
                key={mode}
                onClick={() => setSelectedMockMode(mode)}
                className={`rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  selectedMockMode === mode
                    ? 'bg-zinc-100 text-zinc-950'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
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
                {mockReviews[selectedMockMode].score >= 6 ? 'Strong performance' : 'Requires review'}
              </span>
              <span className="text-[10px] text-zinc-500 mt-1">
                {mockReviews[selectedMockMode].score >= 6 ? 'Top 35% of projects' : 'Below average'}
              </span>
            </div>

            <div className="flex-1 flex flex-col gap-4">
              <div>
                <h4 className="text-xs uppercase tracking-wider text-zinc-400 font-bold mb-1.5">The Critique</h4>
                <p className="text-zinc-300 text-sm leading-relaxed italic bg-zinc-950 border border-zinc-850 rounded-xl p-4">
                  &ldquo;{mockReviews[selectedMockMode].roast}&rdquo;
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
