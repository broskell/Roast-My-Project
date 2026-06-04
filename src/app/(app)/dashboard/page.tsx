'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import apiClient from '../../../utils/apiClient'
import {
  Sparkles,
  TrendingUp,
  Award,
  Zap,
  Trash2,
  ExternalLink,
  ChevronRight,
  Plus,
  FileText
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

interface StatProject {
  id: string
  projectId: string
  title: string
  score: number
  mode: string
}

interface RecentReview {
  id: string
  score: number
  mode: string
  createdAt: string
  roast: string
  project: {
    id: string
    title: string
    screenshotUrl: string
    category: string
  } | null
}

interface HistoryItem {
  id: string
  project: string
  score: number
  mode: string
  date: string
  timestamp: number
}

interface DashboardStats {
  totalProjects: number
  totalReviews: number
  averageScore: number
  highestScoringProject: StatProject | null
  lowestScoringProject: StatProject | null
  recentReviews: RecentReview[]
  reviewHistory: HistoryItem[]
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await apiClient.get('/api/dashboard/stats')
      if (response.data.success) {
        setStats(response.data.stats)
      }
    } catch (err: any) {
      console.error('Error fetching dashboard stats:', err)
      setError('Failed to load dashboard metrics. Please reload the page.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProject = async (projectId: string, e: React.MouseEvent) => {
    e.preventDefault()
    if (!confirm('Are you sure you want to delete this project and all its generated reviews? This action cannot be undone.')) {
      return
    }

    try {
      await apiClient.delete(`/api/projects/${projectId}`)
      // Refresh dashboard data
      fetchDashboardData()
    } catch (err) {
      console.error('Failed to delete project:', err)
      alert('Failed to delete project. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"></div>
          <p className="text-sm text-purple-300/85">Compiling stats...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <div className="glass-panel rounded-2xl p-8 border-orange-500/20 text-orange-400">
          <p className="text-lg font-semibold mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium px-4 py-2 transition-colors cursor-pointer"
          >
            Retry Fetching Data
          </button>
        </div>
      </div>
    )
  }

  const statsList = [
    {
      title: 'Reviews Generated',
      value: stats?.totalReviews || 0,
      description: `From ${stats?.totalProjects || 0} projects`,
      icon: TrendingUp,
      color: 'text-purple-400'
    },
    {
      title: 'Average AI Score',
      value: stats && stats.totalReviews > 0 ? `${stats.averageScore}/10` : 'N/A',
      description: 'Overall technical evaluation',
      icon: Award,
      color: 'text-blue-400'
    },
    {
      title: 'Highest Scoring',
      value: stats?.highestScoringProject ? `${stats.highestScoringProject.score}/10` : 'N/A',
      description: stats?.highestScoringProject?.title || 'No reviews yet',
      icon: Sparkles,
      color: 'text-orange-400'
    },
    {
      title: 'Lowest Scoring',
      value: stats?.lowestScoringProject ? `${stats.lowestScoringProject.score}/10` : 'N/A',
      description: stats?.lowestScoringProject?.title || 'No reviews yet',
      icon: Zap,
      color: 'text-red-400'
    }
  ]

  return (
    <div className="max-w-6xl mx-auto py-4">
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Project Dashboard</h1>
          <p className="text-sm text-white/50">Manage your project reviews, resume scores, and AI performance metrics</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Link
            href="/submit"
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-700 px-5 py-3 text-sm font-semibold text-white transition-colors cursor-pointer shadow-lg shadow-purple-600/15"
          >
            <Plus className="h-4 w-4" />
            Roast Project
          </Link>
          <Link
            href="/resume"
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 px-5 py-3 text-sm font-semibold text-white transition-colors cursor-pointer"
          >
            <FileText className="h-4 w-4 text-orange-400" />
            Roast Resume
          </Link>
        </div>
      </div>

      {/* Grid of Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsList.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <div key={idx} className="glass-panel rounded-2xl p-6 border-white/5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs uppercase tracking-wider font-bold text-white/40">{stat.title}</span>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <p className="text-3xl font-extrabold text-white mb-1">{stat.value}</p>
              <p className="text-xs text-white/55 truncate">{stat.description}</p>
            </div>
          )
        })}
      </div>

      {/* Graph Section & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Recharts Area Chart */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border-white/5 flex flex-col justify-between min-h-[350px]">
          <div>
            <h3 className="text-lg font-bold text-white mb-1">Score History</h3>
            <p className="text-xs text-white/40 mb-6">AI score trends over time from your project reviews</p>
          </div>

          <div className="flex-1 w-full min-h-[220px]">
            {mounted && stats && stats.reviewHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={stats.reviewHistory}
                  margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="scoreGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#a855f7" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis
                    dataKey="date"
                    stroke="rgba(255,255,255,0.3)"
                    fontSize={11}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="rgba(255,255,255,0.3)"
                    fontSize={11}
                    tickLine={false}
                    domain={[0, 10]}
                    tickCount={6}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#110c1c',
                      borderColor: 'rgba(255,255,255,0.08)',
                      borderRadius: '12px',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#a855f7"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#scoreGlow)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-white/30 italic">
                {mounted ? 'Run a project roast to display score history graphs' : 'Preparing graphs...'}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions / Tips */}
        <div className="glass-panel rounded-2xl p-6 border-white/5 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-white mb-2">AI Critique Tips</h3>
            <p className="text-xs text-white/50 mb-4">How to optimize your score and avoid severe roasting:</p>
            <ul className="space-y-3.5 text-xs text-white/70">
              <li className="flex items-start gap-2">
                <span className="text-purple-400 font-bold mt-0.5">•</span>
                <span>Ensure your project screenshots are clean, high-resolution, and clearly showcase the main landing features.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-orange-400 font-bold mt-0.5">•</span>
                <span>Select **Senior Developer Review** for deeper technical design suggestions, rather than simple visual jokes.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-400 font-bold mt-0.5">•</span>
                <span>Add valid GitHub links. The AI will critique your codebase organization based on descriptions and metadata!</span>
              </li>
            </ul>
          </div>
          <div className="pt-6 border-t border-white/5">
            <Link
              href="/profile"
              className="flex items-center justify-between text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors"
            >
              Manage account settings
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent submissions list */}
      <div className="glass-panel rounded-2xl p-6 border-white/5">
        <h3 className="text-lg font-bold text-white mb-1">Recent Project Submissions</h3>
        <p className="text-xs text-white/40 mb-6">View previously generated reviews, trigger new reviews in other modes, or delete projects</p>

        {stats && stats.recentReviews.length > 0 ? (
          <div className="space-y-4">
            {stats.recentReviews.map((review) => {
              if (!review.project) return null
              return (
                <div
                  key={review.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-white/2 border border-white/5 hover:border-white/10 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {/* Project Image */}
                    <div className="h-16 w-24 rounded-lg overflow-hidden border border-white/5 relative bg-white/5 shrink-0">
                      <img
                        src={review.project.screenshotUrl}
                        alt={review.project.title}
                        className="object-cover h-full w-full"
                      />
                    </div>
                    {/* Details */}
                    <div>
                      <h4 className="font-bold text-white text-base leading-tight">
                        {review.project.title}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="rounded bg-purple-500/10 px-2 py-0.5 text-[10px] font-semibold text-purple-300">
                          {review.project.category}
                        </span>
                        <span className="rounded bg-orange-500/10 px-2 py-0.5 text-[10px] font-semibold text-orange-300">
                          {review.mode}
                        </span>
                        <span className="text-[10px] text-white/40">
                          {new Date(review.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/35 font-bold uppercase tracking-wider">Score:</span>
                      <span className={`text-xl font-extrabold ${review.score >= 7 ? 'text-green-400' : review.score >= 5 ? 'text-orange-400' : 'text-red-400'}`}>
                        {review.score}/10
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/results/project/${review.project.id}`}
                        className="flex items-center gap-1 rounded-lg bg-purple-600/15 border border-purple-500/10 px-3 py-1.5 text-xs font-semibold text-purple-300 hover:bg-purple-600 hover:text-white transition-all cursor-pointer"
                      >
                        View Review
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                      <button
                        onClick={(e) => handleDeleteProject(review.project!.id, e)}
                        className="p-2 rounded-lg bg-red-500/10 border border-red-500/10 text-red-400 hover:bg-red-500/20 hover:border-red-500/30 transition-colors cursor-pointer"
                        title="Delete project"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-10 border border-dashed border-white/10 rounded-2xl">
            <p className="text-white/40 text-sm mb-4">No projects submitted yet.</p>
            <Link
              href="/submit"
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-700 px-5 py-2.5 text-xs font-semibold text-white transition-colors cursor-pointer shadow-lg shadow-purple-600/15"
            >
              <Plus className="h-3.5 w-3.5" />
              Submit Your First Project
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
