'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import apiClient from '../../../../src/utils/apiClient'
import {
  Search,
  Plus,
  ChevronLeft,
  Building2,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Clock,
  Brain,
  Layers,
  ShieldCheck
} from 'lucide-react'
import ErrorState from '../../../../src/components/ErrorState'
import { ListSkeleton } from '../../../../src/components/SkeletonLoader'

interface Competitor {
  name: string
  website: string
  description: string
}

interface SimilarStartups {
  existing: string[]
  acquisitions: string[]
  shutdowns: string[]
}

interface MarketOpportunity {
  opportunityScore: number
  growthIndicators: string[]
  marketMaturity: string
}

interface CustomerSegments {
  primary: string
  secondary: string
  earlyAdopters: string
}

interface Risks {
  competition: string
  regulation: string
  technicalComplexity: string
  customerAcquisition: string
  aiCommoditization: string
  capitalRequirements: string
}

interface MvpRoadmap {
  week1: string
  week2: string
  week3: string
  week4: string
}

interface InvestorReview {
  vcQuestions: string[]
  fundingRisks: string[]
  defensibilityConcerns: string[]
}

interface Recommendation {
  decision: 'Build' | 'Pivot' | 'Avoid'
  reasoning: string
}

interface Source {
  sourceTitle: string
  sourceUrl: string
  summary: string
}

interface IdeaReportJSON {
  startupSummary: string
  marketCategory: string
  competitors: {
    direct: Competitor[]
    indirect: Competitor[]
    alternatives: Competitor[]
  }
  similarStartups: SimilarStartups
  whySimilarFailed: string[]
  whySimilarSucceeded: string[]
  marketOpportunity: MarketOpportunity
  customerSegments: CustomerSegments
  risks: Risks
  founderBlindSpots: string[]
  businessModelSuggestions: string[]
  goToMarketStrategy: string[]
  mvpRoadmap: MvpRoadmap
  investorReview: InvestorReview
  recommendation: Recommendation
  sources: Source[]
}

interface IdeaReportDoc {
  id: string
  title: string
  description: string
  targetAudience: string
  industry: string
  countryRegion?: string
  report: IdeaReportJSON
  createdAt: string
}

const LOADING_STEPS = [
  'Validating input parameters and establishing secure channel...',
  'Initiating real-time search queries via Google Search Grounding...',
  'Scanning web indices to identify direct and indirect competitors...',
  'Compiling outcomes of similar startups (shutdowns, acquisitions, exits)...',
  'Analyzing failure reasons (CAC, retention, timing) and success factors...',
  'Running risk vector evaluation (regulation, AI replacement, complexity)...',
  'Synthesizing customer profiles and go-to-market strategies...',
  'Drafting 4-week MVP development roadmap...',
  'Generating final recommendation and writing intelligence report to database...'
]

export default function IdeaResearchPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeReportId = searchParams.get('id')

  // List of reports
  const [reports, setReports] = useState<IdeaReportDoc[]>([])
  const [loadingList, setLoadingList] = useState(true)
  
  // Selected report details
  const [selectedReport, setSelectedReport] = useState<IdeaReportDoc | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  // Creation State
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [industry, setIndustry] = useState('')
  const [countryRegion, setCountryRegion] = useState('')
  
  // Submission Loader State
  const [submitting, setSubmitting] = useState(false)
  const [loaderStepIdx, setLoaderStepIdx] = useState(0)
  
  // Error handling
  const [error, setError] = useState('')
  const [detailError, setDetailError] = useState('')

  // Report Navigation Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'competitors' | 'startups' | 'strategy' | 'roadmap' | 'sources'>('overview')



  const fetchReports = async () => {
    setLoadingList(true)
    setError('')
    try {
      const response = await apiClient.get('/api/idea-research')
      if (response.data.success) {
        setReports(response.data.reports)
      }
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errorObj = err as any
      console.error('Failed to load idea reports:', errorObj)
      setError('Could not fetch historical reports list.')
    } finally {
      setLoadingList(false)
    }
  }

  const fetchReportDetail = async (id: string) => {
    setLoadingDetail(true)
    setDetailError('')
    setShowCreateForm(false)
    try {
      const response = await apiClient.get(`/api/idea-research/${id}`)
      if (response.data.success) {
        setSelectedReport(response.data.report)
        setActiveTab('overview')
      }
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errorObj = err as any
      console.error('Failed to load report detail:', errorObj)
      setDetailError(errorObj.response?.data?.error || 'Failed to load report details.')
    } finally {
      setLoadingDetail(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !description || !targetAudience || !industry) {
      setError('Please fill in all required fields.')
      return
    }

    setSubmitting(true)
    setError('')
    setLoaderStepIdx(0)

    try {
      const response = await apiClient.post('/api/idea-research', {
        title,
        description,
        targetAudience,
        industry,
        countryRegion: countryRegion || 'Global'
      })

      if (response.data.success) {
        // Refresh list
        await fetchReports()
        // Reset form
        setTitle('')
        setDescription('')
        setTargetAudience('')
        setIndustry('')
        setCountryRegion('')
        setShowCreateForm(false)
        // Redirect to URL
        router.push(`/idea-research?id=${response.data.report.id}`)
      }
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errorObj = err as any
      console.error('Failed to submit idea:', errorObj)
      setError(errorObj.response?.data?.error || errorObj.message || 'An error occurred during market research. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSelectReport = (id: string) => {
    router.push(`/idea-research?id=${id}`)
  }

  const handleBackToList = () => {
    router.push('/idea-research')
  }

  // Fetch report list
  useEffect(() => {
    fetchReports()
  }, [])

  // Manage URL state for viewing specific reports
  useEffect(() => {
    if (activeReportId) {
      fetchReportDetail(activeReportId)
    } else {
      const t = setTimeout(() => {
        setSelectedReport(null)
        setShowCreateForm(false)
      }, 0)
      return () => clearTimeout(t)
    }
  }, [activeReportId])

  // Submitting step cycle effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (submitting) {
      interval = setInterval(() => {
        setLoaderStepIdx((prev) => {
          if (prev < LOADING_STEPS.length - 1) {
            return prev + 1
          }
          return prev
        })
      }, 4500)
    } else {
      const t = setTimeout(() => {
        setLoaderStepIdx(0)
      }, 0)
      return () => clearTimeout(t)
    }
    return () => clearInterval(interval)
  }, [submitting])

  return (
    <div className="w-full max-w-none py-4 px-2 space-y-8 animate-in fade-in duration-500">
      
      {/* Upper Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-100 tracking-tight">Idea Intelligence</h1>
          <p className="text-xs text-zinc-400">Validate startup concepts and perform competitor market research using grounded web analysis</p>
        </div>
        {!selectedReport && !showCreateForm && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center justify-center gap-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-semibold px-5 py-3 text-sm transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Research New Idea
          </button>
        )}
      </div>

      {/* Main Grid Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Column: Report List panel */}
        {!selectedReport && !showCreateForm ? (
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-xs uppercase tracking-wider text-zinc-500 font-bold mb-2 flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-zinc-500" />
              Intelligence History
            </h3>

            {loadingList ? (
              <ListSkeleton />
            ) : reports.length > 0 ? (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                {reports.map((report) => (
                  <button
                    key={report.id}
                    onClick={() => handleSelectReport(report.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all text-xs sm:text-sm flex flex-col justify-between hover:bg-zinc-900/20 hover:border-zinc-700 cursor-pointer ${
                      activeReportId === report.id
                        ? 'border-zinc-400 bg-zinc-900/40 text-zinc-100 shadow-sm'
                        : 'border-zinc-800 bg-zinc-950/20 text-zinc-400'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-1.5">
                        <h4 className="font-bold text-zinc-200 truncate pr-4">{report.title}</h4>
                        <span className="rounded bg-zinc-900 border border-zinc-800 px-2 py-0.5 text-[9px] font-medium text-zinc-500 whitespace-nowrap">
                          {report.report.marketCategory}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed mb-3">
                        {report.description}
                      </p>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-zinc-500 border-t border-zinc-900 pt-2.5 w-full">
                      <span>{report.industry}</span>
                      <span>
                        {new Date(report.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border border-dashed border-zinc-800 rounded-2xl bg-zinc-900/10">
                <Brain className="h-8 w-8 text-zinc-600 mx-auto mb-3" />
                <p className="text-zinc-500 text-xs mb-4">No ideas researched yet.</p>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-100 font-semibold px-4 py-2 text-xs transition-colors cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Create Your First Report
                </button>
              </div>
            )}
          </div>
        ) : null}

        {/* Right Columns: Forms, Loader, or Report Detail */}
        <div className={`${selectedReport || showCreateForm || submitting || loadingDetail || detailError ? 'lg:col-span-3' : 'lg:col-span-2 hidden lg:block'}`}>
          
          {/* Submitting Loader */}
          {submitting && (
            <div className="border border-zinc-850 bg-zinc-900/20 rounded-2xl p-10 flex flex-col items-center justify-center text-center space-y-8 min-h-[400px]">
              <div className="relative flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-zinc-400"></div>
                <Brain className="h-6 w-6 text-zinc-400 absolute animate-pulse" />
              </div>
              <div className="space-y-3 max-w-md">
                <h3 className="text-lg font-bold text-zinc-200">Grounded Market Research in Progress</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  We are researching live data, verifying competitors, looking up shutdown histories, and compiling regulatory profiles. This takes about 10-15 seconds.
                </p>
              </div>
              <div className="w-full max-w-sm space-y-2">
                <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-zinc-100 rounded-full transition-all duration-500"
                    style={{ width: `${((loaderStepIdx + 1) / LOADING_STEPS.length) * 100}%` }}
                  ></div>
                </div>
                <div className="text-[10px] text-zinc-400 font-mono italic animate-pulse">
                  {LOADING_STEPS[loaderStepIdx]}
                </div>
              </div>
            </div>
          )}

          {/* Form to Create New Research */}
          {showCreateForm && !submitting && (
            <div className="border border-zinc-800 bg-zinc-900/20 rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-850 pb-4">
                <h2 className="text-lg font-bold text-white">Startup Idea Validation</h2>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1 cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              {error && (
                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950 text-xs sm:text-sm text-zinc-300 flex items-start gap-2.5">
                  <AlertTriangle className="h-5 w-5 shrink-0 text-zinc-400" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="idea-name" className="text-xs font-bold uppercase text-zinc-400 tracking-wider">Idea Name *</label>
                  <input
                    id="idea-name"
                    type="text"
                    required
                    placeholder="e.g. CampusCompass, CleanSaaS, TalentFlow"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="idea-desc" className="text-xs font-bold uppercase text-zinc-400 tracking-wider">Idea Description *</label>
                  <textarea
                    id="idea-desc"
                    required
                    rows={4}
                    placeholder="Briefly describe what your product does, what problems it solves, and how you think it will work. E.g. An AI-powered navigation and quiz matching platform to help college freshmen find clubs on campus..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="idea-audience" className="text-xs font-bold uppercase text-zinc-400 tracking-wider">Target Audience *</label>
                    <input
                      id="idea-audience"
                      type="text"
                      required
                      placeholder="e.g. College Freshmen, Small Retailers, Indie Hackers"
                      value={targetAudience}
                      onChange={(e) => setTargetAudience(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="idea-industry" className="text-xs font-bold uppercase text-zinc-400 tracking-wider">Industry *</label>
                    <input
                      id="idea-industry"
                      type="text"
                      required
                      placeholder="e.g. EdTech, SaaS, Healthcare, FinTech, E-Commerce"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="idea-region" className="text-xs font-bold uppercase text-zinc-400 tracking-wider">Country / Region of Focus</label>
                  <input
                    id="idea-region"
                    type="text"
                    placeholder="e.g. United States, Global, India, Europe (default: Global)"
                    value={countryRegion}
                    onChange={(e) => setCountryRegion(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-zinc-500"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-semibold py-4 transition-colors cursor-pointer"
                  >
                    <Search className="h-5 w-5" />
                    Verify Idea & Compile Report
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Loader or Detail Loading state */}
          {loadingDetail && (
            <div className="border border-zinc-800 bg-zinc-900/20 rounded-2xl p-6 min-h-[400px] flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="h-1 bg-zinc-850 w-32 rounded-full overflow-hidden relative">
                  <div className="h-full bg-zinc-300 rounded-full w-1/2 animate-[pulse_1.5s_infinite]"></div>
                </div>
                <p className="text-xs font-semibold text-zinc-500 animate-pulse tracking-wide">Fetching research data...</p>
              </div>
            </div>
          )}

          {/* Render detail error */}
          {detailError && !loadingDetail && (
            <div className="border border-zinc-850 bg-zinc-900/20 rounded-2xl p-6 min-h-[300px]">
              <ErrorState
                title="Error Loading Report"
                description={detailError}
                onRetry={() => activeReportId && fetchReportDetail(activeReportId)}
              />
            </div>
          )}

          {/* Render Selected Intelligence Report */}
          {selectedReport && !loadingDetail && !detailError && (
            <div className="space-y-6">
              
              {/* Back Button */}
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={handleBackToList}
                  className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-200 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                  All Reports
                </button>
                <span className="rounded bg-zinc-900 border border-zinc-850 px-2.5 py-1 text-[10px] font-semibold text-zinc-400">
                  Search Grounded Report
                </span>
              </div>

              {/* Title Header Card */}
              <div className="border border-zinc-800 bg-zinc-900/20 rounded-2xl p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-extrabold text-zinc-100 tracking-tight leading-tight">{selectedReport.title}</h2>
                    <p className="text-xs text-zinc-400 mt-1">Industry: {selectedReport.industry} | Focus: {selectedReport.countryRegion || 'Global'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5" />
                      {selectedReport.report.marketCategory}
                    </span>
                  </div>
                </div>
                <p className="text-zinc-300 text-sm leading-relaxed p-4 bg-zinc-950/80 border border-zinc-850 rounded-xl leading-normal">
                  {selectedReport.description}
                </p>
              </div>

              {/* Score & Recommendation Card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* 1. Decision Recommendation card */}
                <div className={`md:col-span-2 border rounded-xl p-5 flex flex-col justify-between space-y-3 ${
                  selectedReport.report.recommendation.decision === 'Build' 
                    ? 'border-zinc-700 bg-zinc-950/40' 
                    : selectedReport.report.recommendation.decision === 'Pivot'
                      ? 'border-zinc-800 bg-zinc-950/20'
                      : 'border-zinc-850 bg-zinc-950/10'
                }`}>
                  <div className="space-y-1">
                    <span className="text-[10px] tracking-wider uppercase text-zinc-500 font-bold">RECOMMENDED DECISION</span>
                    <div className="flex items-center gap-2">
                      {selectedReport.report.recommendation.decision === 'Build' && (
                        <CheckCircle className="h-6 w-6 text-zinc-400" />
                      )}
                      {selectedReport.report.recommendation.decision === 'Pivot' && (
                        <AlertTriangle className="h-6 w-6 text-zinc-500" />
                      )}
                      {selectedReport.report.recommendation.decision === 'Avoid' && (
                        <AlertTriangle className="h-6 w-6 text-red-500/80" />
                      )}
                      <span className="text-xl font-black text-zinc-100 tracking-tight">
                        {selectedReport.report.recommendation.decision} Idea
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    {selectedReport.report.recommendation.reasoning}
                  </p>
                </div>

                {/* 2. Opportunity Score card */}
                <div className="border border-zinc-800 bg-zinc-900/20 rounded-xl p-5 flex flex-col justify-between items-center text-center">
                  <span className="text-[10px] tracking-wider uppercase text-zinc-500 font-bold">OPPORTUNITY SCORE</span>
                  <div className="flex items-baseline gap-1 mt-2 mb-1">
                    <span className="text-5xl font-black text-zinc-100 tracking-tighter">
                      {selectedReport.report.marketOpportunity.opportunityScore}
                    </span>
                    <span className="text-xs text-zinc-500 font-medium">/ 100</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider bg-zinc-900 border border-zinc-850 px-2 py-0.5 rounded">
                    {selectedReport.report.marketOpportunity.marketMaturity}
                  </span>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div 
                className="flex overflow-x-auto gap-1 p-1 bg-zinc-950/80 border border-zinc-800/60 rounded-xl max-w-full no-scrollbar shadow-inner"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {(
                  [
                    { key: 'overview', label: 'Overview' },
                    { key: 'competitors', label: 'Competitors' },
                    { key: 'startups', label: 'Similar Outcomes' },
                    { key: 'strategy', label: 'Risks & Strategy' },
                    { key: 'roadmap', label: 'Roadmap & VC' },
                    { key: 'sources', label: 'Citations' }
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`rounded-lg px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      activeTab === tab.key
                        ? 'bg-zinc-800 text-zinc-100 shadow-md border border-zinc-700/60 font-bold scale-[1.01]'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* TAB CONTENT PANEL */}
              <div className="border border-zinc-800 bg-zinc-900/20 backdrop-blur-md rounded-2xl p-6 sm:p-8 min-h-[300px] shadow-xl space-y-6">
                
                {/* 1. OVERVIEW TAB */}
                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <div className="bg-zinc-950/40 border-l-2 border-zinc-500 rounded-r-xl p-5 border border-zinc-800/60 border-l-0 space-y-2 shadow-sm">
                      <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Startup Summary</h3>
                      <p className="text-zinc-200 text-sm leading-relaxed whitespace-pre-line font-medium">
                        {selectedReport.report.startupSummary}
                      </p>
                    </div>

                    <div className="border-t border-zinc-900 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase text-zinc-400 tracking-wider">Customer Segments</h4>
                        <div className="space-y-3">
                          <div className="bg-zinc-950/40 border border-zinc-800/80 hover:border-zinc-700/60 p-4 rounded-xl text-xs sm:text-sm space-y-1.5 transition-all shadow-sm">
                            <span className="font-bold text-zinc-200 flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-zinc-400"></span>
                              Primary Segment
                            </span>
                            <p className="text-zinc-400 leading-relaxed pl-3.5">{selectedReport.report.customerSegments.primary}</p>
                          </div>
                          <div className="bg-zinc-950/40 border border-zinc-800/80 hover:border-zinc-700/60 p-4 rounded-xl text-xs sm:text-sm space-y-1.5 transition-all shadow-sm">
                            <span className="font-bold text-zinc-200 flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-zinc-500"></span>
                              Secondary Segment
                            </span>
                            <p className="text-zinc-400 leading-relaxed pl-3.5">{selectedReport.report.customerSegments.secondary}</p>
                          </div>
                          <div className="bg-zinc-950/40 border border-zinc-800/80 hover:border-zinc-700/60 p-4 rounded-xl text-xs sm:text-sm space-y-1.5 transition-all shadow-sm">
                            <span className="font-bold text-zinc-200 flex items-center gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-zinc-600"></span>
                              Early Adopters
                            </span>
                            <p className="text-zinc-400 leading-relaxed pl-3.5">{selectedReport.report.customerSegments.earlyAdopters}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase text-zinc-400 tracking-wider">Opportunity Indicators</h4>
                        <ul className="space-y-3">
                          {selectedReport.report.marketOpportunity.growthIndicators.map((val, idx) => (
                            <li key={idx} className="flex gap-3 items-start text-xs sm:text-sm text-zinc-300 bg-zinc-950/30 border border-zinc-800/60 p-4 rounded-xl transition-all hover:bg-zinc-950/50 shadow-sm leading-relaxed">
                              <span className="h-6 w-6 shrink-0 rounded-full bg-zinc-900 border border-zinc-800 text-[10px] font-bold text-zinc-400 flex items-center justify-center mt-0.5 shadow-inner">
                                {idx + 1}
                              </span>
                              <span className="pt-0.5 font-medium">{val}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. COMPETITORS TAB */}
                {activeTab === 'competitors' && (
                  <div className="space-y-8 animate-in fade-in duration-350">
                    {/* Direct Competitors */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-zinc-400" />
                        Direct Competitors
                      </h3>
                      {selectedReport.report.competitors.direct.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {selectedReport.report.competitors.direct.map((comp, idx) => (
                            <div key={idx} className="bg-zinc-950/40 border border-zinc-800/80 hover:border-zinc-700/60 p-4 rounded-xl space-y-2.5 transition-all shadow-sm">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-zinc-200 text-sm flex items-center gap-2">
                                  <span className="h-2 w-2 rounded-full bg-zinc-100"></span>
                                  {comp.name}
                                </span>
                                {comp.website && comp.website !== 'N/A' && (
                                  <a
                                    href={comp.website}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[10px] text-zinc-500 hover:text-zinc-300 flex items-center gap-0.5 transition-colors"
                                  >
                                    Visit
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}
                              </div>
                              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">{comp.description}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-zinc-500 italic pl-1">No direct competitors found in initial research.</p>
                      )}
                    </div>

                    {/* Indirect Competitors */}
                    <div className="space-y-3 border-t border-zinc-900 pt-6">
                      <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-zinc-500" />
                        Indirect Competitors
                      </h3>
                      {selectedReport.report.competitors.indirect.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {selectedReport.report.competitors.indirect.map((comp, idx) => (
                            <div key={idx} className="bg-zinc-950/40 border border-zinc-800/80 hover:border-zinc-700/60 p-4 rounded-xl space-y-2.5 transition-all shadow-sm">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-zinc-200 text-sm flex items-center gap-2">
                                  <span className="h-2 w-2 rounded-full bg-zinc-400"></span>
                                  {comp.name}
                                </span>
                                {comp.website && comp.website !== 'N/A' && (
                                  <a
                                    href={comp.website}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[10px] text-zinc-500 hover:text-zinc-300 flex items-center gap-0.5 transition-colors"
                                  >
                                    Visit
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}
                              </div>
                              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">{comp.description}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-zinc-500 italic pl-1">No indirect competitors discovered.</p>
                      )}
                    </div>

                    {/* Alternatives */}
                    <div className="space-y-3 border-t border-zinc-900 pt-6">
                      <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-zinc-650" />
                        Alternative Solutions
                      </h3>
                      {selectedReport.report.competitors.alternatives.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {selectedReport.report.competitors.alternatives.map((comp, idx) => (
                            <div key={idx} className="bg-zinc-950/40 border border-zinc-800/80 hover:border-zinc-700/60 p-4 rounded-xl space-y-2.5 transition-all shadow-sm">
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-zinc-200 text-sm flex items-center gap-2">
                                  <span className="h-2 w-2 rounded-full bg-zinc-600"></span>
                                  {comp.name}
                                </span>
                                {comp.website && comp.website !== 'N/A' && (
                                  <a
                                    href={comp.website}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[10px] text-zinc-500 hover:text-zinc-300 flex items-center gap-0.5 transition-colors"
                                  >
                                    Visit
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}
                              </div>
                              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">{comp.description}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-zinc-500 italic pl-1">No alternative workarounds listed.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* 3. SIMILAR OUTCOMES TAB */}
                {activeTab === 'startups' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Existing Startups */}
                      <div className="bg-zinc-950/40 border border-zinc-800/80 border-t-2 border-t-zinc-400 p-4 rounded-xl space-y-3 shadow-sm">
                        <span className="text-[10px] tracking-wider uppercase text-zinc-400 font-bold flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-zinc-200 animate-pulse shrink-0"></span>
                          Active & Operational
                        </span>
                        <ul className="space-y-2 text-xs sm:text-sm text-zinc-300 font-medium">
                          {selectedReport.report.similarStartups.existing.map((item, idx) => (
                            <li key={idx} className="flex gap-2 items-center bg-zinc-900/40 px-2.5 py-1.5 border border-zinc-850 rounded-lg">
                              <span className="h-1 w-1 rounded-full bg-zinc-500"></span>
                              <span>{item}</span>
                            </li>
                          ))}
                          {selectedReport.report.similarStartups.existing.length === 0 && (
                            <li className="text-zinc-500 italic text-xs pl-1">None identified</li>
                          )}
                        </ul>
                      </div>
                      
                      {/* Acquired Startups */}
                      <div className="bg-zinc-950/40 border border-zinc-800/80 border-t-2 border-t-zinc-500 p-4 rounded-xl space-y-3 shadow-sm">
                        <span className="text-[10px] tracking-wider uppercase text-zinc-400 font-bold flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 shrink-0"></span>
                          Acquired / Merged
                        </span>
                        <ul className="space-y-2 text-xs sm:text-sm text-zinc-300 font-medium">
                          {selectedReport.report.similarStartups.acquisitions.map((item, idx) => (
                            <li key={idx} className="flex gap-2 items-center bg-zinc-900/40 px-2.5 py-1.5 border border-zinc-850 rounded-lg">
                              <span className="h-1 w-1 rounded-full bg-zinc-500"></span>
                              <span>{item}</span>
                            </li>
                          ))}
                          {selectedReport.report.similarStartups.acquisitions.length === 0 && (
                            <li className="text-zinc-500 italic text-xs pl-1">None identified</li>
                          )}
                        </ul>
                      </div>

                      {/* Shutdowns */}
                      <div className="bg-zinc-950/40 border border-zinc-800/80 border-t-2 border-t-zinc-700 p-4 rounded-xl space-y-3 shadow-sm">
                        <span className="text-[10px] tracking-wider uppercase text-zinc-400 font-bold flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-zinc-600 shrink-0"></span>
                          Shutdown / Failed
                        </span>
                        <ul className="space-y-2 text-xs sm:text-sm text-zinc-300 font-medium">
                          {selectedReport.report.similarStartups.shutdowns.map((item, idx) => (
                            <li key={idx} className="flex gap-2 items-center bg-zinc-900/40 px-2.5 py-1.5 border border-zinc-850 rounded-lg">
                              <span className="h-1 w-1 rounded-full bg-zinc-500"></span>
                              <span>{item}</span>
                            </li>
                          ))}
                          {selectedReport.report.similarStartups.shutdowns.length === 0 && (
                            <li className="text-zinc-500 italic text-xs pl-1">None identified</li>
                          )}
                        </ul>
                      </div>
                    </div>

                    <div className="border-t border-zinc-900 pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase text-zinc-400 tracking-wider">Failure Analysis</h4>
                        <ul className="space-y-3">
                          {selectedReport.report.whySimilarFailed.map((reason, idx) => (
                            <li key={idx} className="flex gap-3 text-xs sm:text-sm text-zinc-300 bg-zinc-950/30 p-4 rounded-xl border border-zinc-800/60 leading-relaxed shadow-sm">
                              <span className="h-6 w-6 shrink-0 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 flex items-center justify-center font-bold text-xs shadow-inner">
                                {idx + 1}
                              </span>
                              <span className="pt-0.5 font-medium">{reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase text-zinc-400 tracking-wider">Success Factors</h4>
                        <ul className="space-y-3">
                          {selectedReport.report.whySimilarSucceeded.map((reason, idx) => (
                            <li key={idx} className="flex gap-3 text-xs sm:text-sm text-zinc-300 bg-zinc-950/30 p-4 rounded-xl border border-zinc-800/60 leading-relaxed shadow-sm">
                              <span className="h-6 w-6 shrink-0 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-100 flex items-center justify-center font-bold text-xs shadow-inner">
                                {idx + 1}
                              </span>
                              <span className="pt-0.5 font-medium">{reason}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. RISKS & STRATEGY TAB */}
                {activeTab === 'strategy' && (
                  <div className="space-y-8">
                    {/* Risks */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Critical Risk Vectors</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {[
                          { title: 'Competition', val: selectedReport.report.risks.competition, color: 'border-l-zinc-300' },
                          { title: 'Regulation & Legal', val: selectedReport.report.risks.regulation, color: 'border-l-zinc-500' },
                          { title: 'Technical Complexity', val: selectedReport.report.risks.technicalComplexity, color: 'border-l-zinc-700' },
                          { title: 'Customer Acquisition', val: selectedReport.report.risks.customerAcquisition, color: 'border-l-zinc-450' },
                          { title: 'AI Commoditization', val: selectedReport.report.risks.aiCommoditization, color: 'border-l-zinc-600' },
                          { title: 'Capital Requirements', val: selectedReport.report.risks.capitalRequirements, color: 'border-l-zinc-550' }
                        ].map((risk, idx) => (
                          <div key={idx} className={`bg-zinc-950/40 border border-zinc-800/80 border-l-2 ${risk.color} p-4 rounded-r-xl text-xs sm:text-sm space-y-1.5 transition-all hover:border-zinc-700/60 shadow-sm leading-relaxed`}>
                            <span className="font-bold text-zinc-200 block">{risk.title}</span>
                            <p className="text-zinc-400 pl-0.5">{risk.val}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Suggestions */}
                    <div className="border-t border-zinc-900 pt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase text-zinc-400 tracking-wider">Business Models</h4>
                        <ul className="space-y-2.5">
                          {selectedReport.report.businessModelSuggestions.map((item, idx) => (
                            <li key={idx} className="bg-zinc-950/40 border border-zinc-800/80 p-3.5 rounded-xl text-xs sm:text-sm font-semibold text-zinc-300 flex items-start gap-2.5 shadow-sm leading-relaxed">
                              <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 mt-1.5 shrink-0"></span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase text-zinc-400 tracking-wider">Go-To-Market Channels</h4>
                        <ul className="space-y-2.5">
                          {selectedReport.report.goToMarketStrategy.map((item, idx) => (
                            <li key={idx} className="bg-zinc-950/40 border border-zinc-800/80 p-3.5 rounded-xl text-xs sm:text-sm font-semibold text-zinc-300 flex items-start gap-2.5 shadow-sm leading-relaxed">
                              <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 mt-1.5 shrink-0"></span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase text-zinc-400 tracking-wider">Founder Blind Spots</h4>
                        <ul className="space-y-2.5">
                          {selectedReport.report.founderBlindSpots.map((item, idx) => (
                            <li key={idx} className="bg-zinc-950/40 border border-zinc-800/80 p-3.5 rounded-xl text-xs sm:text-sm font-semibold text-zinc-300 flex items-start gap-2.5 shadow-sm leading-relaxed">
                              <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 mt-1.5 shrink-0"></span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* 5. ROADMAP & VC TAB */}
                {activeTab === 'roadmap' && (
                  <div className="space-y-8">
                    {/* MVP Roadmap */}
                    <div className="space-y-4">
                      <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">4-Week MVP Roadmap</h3>
                      <div className="space-y-5 relative pl-4 border-l border-zinc-800">
                        {[
                          { week: 'Week 1', title: 'Scope & Design', val: selectedReport.report.mvpRoadmap.week1 },
                          { week: 'Week 2', title: 'Build Core Features', val: selectedReport.report.mvpRoadmap.week2 },
                          { week: 'Week 3', title: 'Testing & Feedback', val: selectedReport.report.mvpRoadmap.week3 },
                          { week: 'Week 4', title: 'Launch Prep & Marketing', val: selectedReport.report.mvpRoadmap.week4 }
                        ].map((step, idx) => (
                          <div key={idx} className="relative space-y-1">
                            {/* Timeline node */}
                            <span className="absolute -left-[27px] top-0 h-5 w-5 rounded-full bg-zinc-900 border-2 border-zinc-800 text-[10px] font-bold text-zinc-400 flex items-center justify-center shrink-0 shadow-inner">
                              {idx + 1}
                            </span>
                            <div className="pl-2 space-y-1">
                              <h4 className="text-xs uppercase tracking-wider font-bold text-zinc-200 flex items-center gap-2">
                                <span>{step.week}:</span>
                                <span className="text-zinc-400 font-medium">{step.title}</span>
                              </h4>
                              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">{step.val}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* VC Investor Concerns */}
                    <div className="border-t border-zinc-900 pt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase text-zinc-400 tracking-wider">Defensibility Concerns</h4>
                        <ul className="space-y-2.5">
                          {selectedReport.report.investorReview.defensibilityConcerns.map((val, idx) => (
                            <li key={idx} className="bg-zinc-950/40 border border-zinc-800/80 p-3.5 rounded-xl text-xs sm:text-sm text-zinc-300 font-medium leading-relaxed shadow-sm">
                              {val}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase text-zinc-400 tracking-wider">VC Questions to Prepare</h4>
                        <ul className="space-y-2.5">
                          {selectedReport.report.investorReview.vcQuestions.map((val, idx) => (
                            <li key={idx} className="bg-zinc-950/40 border border-zinc-800/80 p-3.5 rounded-xl text-xs sm:text-sm text-zinc-300 font-semibold italic leading-relaxed shadow-sm">
                              &ldquo;{val}&rdquo;
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase text-zinc-400 tracking-wider">Fundraising Risks</h4>
                        <ul className="space-y-2.5">
                          {selectedReport.report.investorReview.fundingRisks.map((val, idx) => (
                            <li key={idx} className="bg-zinc-950/40 border border-zinc-800/80 p-3.5 rounded-xl text-xs sm:text-sm text-zinc-300 font-medium leading-relaxed shadow-sm">
                              {val}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. CITATIONS TAB */}
                {activeTab === 'sources' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-zinc-900 pb-3 mb-2">
                      <ShieldCheck className="h-5 w-5 text-zinc-400" />
                      <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Search Grounding Evidence Sources</h3>
                    </div>
                    {selectedReport.report.sources.length > 0 ? (
                      <div className="space-y-3">
                        {selectedReport.report.sources.map((src, idx) => (
                          <div key={idx} className="bg-zinc-950/40 border border-zinc-800/80 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start gap-4 hover:border-zinc-700/60 transition-all shadow-sm">
                            <div className="space-y-1 max-w-xl">
                              <span className="text-[10px] text-zinc-500 font-mono tracking-wide block">Source #{idx + 1}</span>
                              <h4 className="font-bold text-zinc-200 text-sm leading-snug">{src.sourceTitle}</h4>
                              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed mt-1">{src.summary}</p>
                            </div>
                            {src.sourceUrl && src.sourceUrl !== 'N/A' && (
                              <a
                                href={src.sourceUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="w-full sm:w-auto text-xs font-semibold text-zinc-950 bg-zinc-100 hover:bg-zinc-200 px-3.5 py-2 rounded-lg flex items-center justify-center gap-1 shrink-0 transition-colors cursor-pointer shadow-sm"
                              >
                                View Evidence
                                <ExternalLink className="h-3.5 w-3.5 text-zinc-950" />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-10">
                        <p className="text-xs text-zinc-500 italic">No citations returned. Research is grounded using model search training.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Empty Workspace Instruction Panel */}
          {!selectedReport && !showCreateForm && (
            <div className="border border-zinc-800 bg-zinc-900/20 rounded-2xl p-8 text-center space-y-6 min-h-[400px] flex flex-col items-center justify-center">
              <Brain className="h-12 w-12 text-zinc-500 animate-pulse" />
              <div className="space-y-2 max-w-md">
                <h2 className="text-xl font-bold text-white tracking-tight">Intelligence validation dashboard</h2>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Select an idea from your history to view its grounded validation report, or click &quot;Research New Idea&quot; to start real-time web research on a new business.
                </p>
              </div>
              <button
                onClick={() => setShowCreateForm(true)}
                className="rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-semibold px-6 py-3.5 text-xs transition-colors cursor-pointer"
              >
                Research Startup Idea
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
