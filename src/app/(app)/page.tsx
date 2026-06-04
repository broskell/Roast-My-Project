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
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm font-semibold mb-6">
          <Sparkles className="h-4 w-4 text-purple-400" />
          <span>Vercel-compatible serverless AI roasting</span>
        </div>
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
          Get Your Code and Resume <br />
          <span className="text-gradient-orange">Roasted by Gemini AI</span>
        </h1>
        <p className="text-lg sm:text-xl text-white/60 mb-8 max-w-2xl mx-auto">
          Upload a project screenshot or your resume PDF. Choose your review mode—from friendly advice to brutal destruction—and get structured AI critiques instantly.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/submit"
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-8 py-4 text-base font-semibold text-white hover:bg-purple-700 hover:shadow-lg hover:shadow-purple-600/25 transition-all cursor-pointer"
          >
            Roast My Project
            <ArrowRight className="h-5 w-5" />
          </Link>
          <Link
            href="/resume"
            className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/10 px-8 py-4 text-base font-semibold text-white hover:bg-white/10 transition-all cursor-pointer"
          >
            <FileText className="h-5 w-5 text-orange-400" />
            Analyze Resume PDF
          </Link>
        </div>
      </section>

      {/* Feature Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-20 px-4">
        <div className="glass-panel rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 h-24 w-24 bg-purple-600/10 rounded-bl-full blur-xl group-hover:bg-purple-600/20 transition-colors"></div>
          <Terminal className="h-10 w-10 text-purple-400 mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">5 Review Modes</h3>
          <p className="text-sm text-white/60">
            Toggle between Funny, Brutal, Recruiter, Senior Architect, and VC Investor perspectives.
          </p>
        </div>
        <div className="glass-panel rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 h-24 w-24 bg-orange-600/10 rounded-bl-full blur-xl group-hover:bg-orange-600/20 transition-colors"></div>
          <Sparkles className="h-10 w-10 text-orange-400 mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Multimodal Gemini AI</h3>
          <p className="text-sm text-white/60">
            Gemini reads your project screenshot, auto-detects its category, and reads PDF resume texts.
          </p>
        </div>
        <div className="glass-panel rounded-2xl p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 h-24 w-24 bg-blue-600/10 rounded-bl-full blur-xl group-hover:bg-blue-600/20 transition-colors"></div>
          <Award className="h-10 w-10 text-blue-400 mb-4" />
          <h3 className="text-lg font-bold text-white mb-2">Payload CMS 3.x Admin</h3>
          <p className="text-sm text-white/60">
            An admin portal to edit prompt templates on the fly, moderate projects, and view analytics.
          </p>
        </div>
      </section>

      {/* Interactive Mock Review Section */}
      <section className="w-full max-w-4xl mx-auto px-4 mb-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-4xl font-bold mb-3 text-white">Witness the Destruction</h2>
          <p className="text-sm sm:text-base text-white/50">Select a review mode below to preview a sample roast output</p>
        </div>

        <div className="glass-panel rounded-3xl overflow-hidden border border-white/5 shadow-2xl">
          {/* Tabs */}
          <div className="flex border-b border-white/5 bg-white/2 p-2 gap-1 overflow-x-auto">
            {Object.keys(mockReviews).map((mode) => (
              <button
                key={mode}
                onClick={() => setSelectedMockMode(mode)}
                className={`rounded-xl px-4 py-2 text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  selectedMockMode === mode
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                    : 'text-white/50 hover:text-white/80 hover:bg-white/5'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-6 sm:p-8 flex flex-col md:flex-row gap-8 items-start">
            <div className="flex flex-col items-center gap-2 justify-center w-full md:w-1/4">
              <div className="relative flex items-center justify-center h-28 w-28 rounded-full border-4 border-orange-500/20">
                <span className="text-4xl font-extrabold text-orange-500">{mockReviews[selectedMockMode].score}</span>
                <span className="absolute bottom-1 text-[10px] text-white/40 uppercase tracking-widest">Score / 10</span>
              </div>
              <span className="text-xs font-semibold text-white/40 mt-1 uppercase tracking-widest">{selectedMockMode}</span>
            </div>

            <div className="flex-1 flex flex-col gap-4">
              <div>
                <h4 className="text-xs uppercase tracking-wider text-orange-400 font-bold mb-1">🔥 The Roast</h4>
                <p className="text-white/90 text-sm leading-relaxed italic bg-orange-500/5 rounded-xl border border-orange-500/10 p-4">
                  "{mockReviews[selectedMockMode].roast}"
                </p>
              </div>
              <div>
                <h4 className="text-xs uppercase tracking-wider text-purple-400 font-bold mb-1">📋 Technical Review</h4>
                <p className="text-white/70 text-sm leading-relaxed">
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
