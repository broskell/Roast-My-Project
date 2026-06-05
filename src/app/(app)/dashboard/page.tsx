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
  FileText,
  LayoutDashboard,
  Clock
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { CardSkeleton, GraphSkeleton, ListSkeleton } from '../../../components/SkeletonLoader'

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

interface ActivityItem {
  id: string
  type: 'project_submitted' | 'review_generated' | 'resume_reviewed'
  title: string
  timestamp: number
  date: string
}

interface DashboardStats {
  totalProjects: number
  totalReviews: number
  averageScore: number
  highestScoringProject: StatProject | null
  lowestScoringProject: StatProject | null
  recentReviews: RecentReview[]
  reviewHistory: HistoryItem[]
  recentActivity: ActivityItem[]
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
      fetchDashboardData()
    } catch (err) {
      console.error('Failed to delete project:', err)
      alert('Failed to delete project. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-4 space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-zinc-800 rounded animate-pulse"></div>
            <div className="h-4 w-72 bg-zinc-800 rounded animate-pulse"></div>
          </div>
          <div className="h-12 w-48 bg-zinc-850 border border-zinc-800 rounded-xl animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <GraphSkeleton />
          </div>
          <div>
            <CardSkeleton />
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4 text-center">
        <div className="w-full max-w-lg mx-auto p-8 rounded-2xl border border-zinc-800 bg-zinc-950 flex flex-col items-center text-center space-y-4">
          <div className="p-3 rounded-full bg-zinc-900 border border-zinc-850 text-zinc-400">
            <Zap className="h-6 w-6" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-sm font-semibold text-zinc-200">{error}</h3>
          </div>
          <button
            onClick={fetchDashboardData}
            className="rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-semibold px-4 py-2 text-xs transition-colors cursor-pointer"
          >
            Retry Fetching Data
          </button>
        </div>
      </div>
    )
  }

  const statsList = [
    {
      title: 'Total Projects',
      value: stats?.totalProjects || 0,
      description: 'Active uploads',
      icon: LayoutDashboard
    },
    {
      title: 'Total Reviews',
      value: stats?.totalReviews || 0,
      description: 'Critiques completed',
      icon: TrendingUp
    },
    {
      title: 'Average Score',
      value: stats && stats.totalReviews > 0 ? `${stats.averageScore}/10` : 'N/A',
      description: 'Out of 10.0 scale',
      icon: Award
    },
    {
      title: 'Best Project',
      value: stats?.highestScoringProject ? `${stats.highestScoringProject.score}/10` : 'N/A',
      description: stats?.highestScoringProject?.title || 'No reviews yet',
      icon: Sparkles
    }
  ]

  // Calculate review score ranges for the distribution chart
  const distributionData = [
    { range: '1-2', count: 0 },
    { range: '3-4', count: 0 },
    { range: '5-6', count: 0 },
    { range: '7-8', count: 0 },
    { range: '9-10', count: 0 },
  ]

  if (stats?.reviewHistory) {
    stats.reviewHistory.forEach((item) => {
      const score = item.score
      if (score >= 1 && score <= 2) distributionData[0].count++
      else if (score >= 3 && score <= 4) distributionData[1].count++
      else if (score >= 5 && score <= 6) distributionData[2].count++
      else if (score >= 7 && score <= 8) distributionData[3].count++
      else if (score >= 9 && score <= 10) distributionData[4].count++
    })
  }

  return (
    <div className="max-w-6xl mx-auto py-4">
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-zinc-100 tracking-tight">Workspace</h1>
          <p className="text-xs text-zinc-400">Manage project reviews, resume scores, and AI performance metrics</p>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <Link
            href="/submit"
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 px-5 py-3 text-sm font-semibold text-zinc-950 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Roast Project
          </Link>
          <Link
            href="/resume"
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 rounded-xl bg-zinc-900 border border-zinc-850 hover:bg-zinc-800 px-5 py-3 text-sm font-semibold text-zinc-100 transition-colors cursor-pointer"
          >
            <FileText className="h-4 w-4 text-zinc-400" />
            Roast Resume
          </Link>
        </div>
      </div>

      {/* Grid of Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsList.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <div key={idx} className="glass-panel rounded-2xl p-6 border-zinc-800 bg-zinc-900/40">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">{stat.title}</span>
                <Icon className="h-5 w-5 text-zinc-400" />
              </div>
              <p className="text-3xl font-extrabold text-zinc-100 mb-1">{stat.value}</p>
              <p className="text-xs text-zinc-500 truncate">{stat.description}</p>
            </div>
          )
        })}
      </div>

      {/* Graph Section & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Recharts Bar Chart - Review Distribution */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border-zinc-800 bg-zinc-900/40 flex flex-col justify-between min-h-[350px]">
          <div>
            <h3 className="text-lg font-bold text-zinc-100 mb-1">Review Distribution</h3>
            <p className="text-xs text-zinc-500 mb-6">Grayscale representation of scores across your projects</p>
          </div>

          <div className="flex-1 w-full min-h-[220px]">
            {mounted && stats && stats.reviewHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={distributionData}
                  margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <XAxis
                    dataKey="range"
                    stroke="rgba(255,255,255,0.2)"
                    fontSize={11}
                    tickLine={false}
                  />
                  <YAxis
                    stroke="rgba(255,255,255,0.2)"
                    fontSize={11}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#18181b',
                      borderColor: '#27272a',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  />
                  <Bar
                    dataKey="count"
                    fill="#e4e4e7"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={48}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-zinc-500 italic">
                {mounted ? 'Submit a project to populate the distribution graph' : 'Preparing distribution metrics...'}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity Timeline Feed */}
        <div className="glass-panel rounded-2xl p-6 border-zinc-800 bg-zinc-900/40 flex flex-col justify-between min-h-[350px]">
          <div>
            <h3 className="text-lg font-bold text-zinc-100 mb-1">Recent Activity</h3>
            <p className="text-xs text-zinc-500 mb-6">Workspace event timeline</p>
            
            <div className="space-y-4 max-h-[200px] overflow-y-auto pr-1">
              {stats && stats.recentActivity && stats.recentActivity.length > 0 ? (
                stats.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex gap-3 text-xs">
                    <div className="flex flex-col items-center">
                      <div className="h-2 w-2 rounded-full bg-zinc-400 mt-1.5 shrink-0"></div>
                      <div className="w-[1px] flex-1 bg-zinc-800 my-1"></div>
                    </div>
                    <div className="space-y-0.5 pb-2">
                      <p className="text-zinc-200 font-medium leading-tight">{activity.title}</p>
                      <p className="text-[10px] text-zinc-500">{activity.date}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-zinc-500 italic">No workspace activity yet.</p>
              )}
            </div>
          </div>
          <div className="pt-4 border-t border-zinc-800">
            <Link
              href="/profile"
              className="flex items-center justify-between text-xs font-semibold text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Account settings
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Recent submissions list */}
      <div className="glass-panel rounded-2xl p-6 border-zinc-800 bg-zinc-900/40">
        <h3 className="text-lg font-bold text-zinc-100 mb-1">Recent Projects</h3>
        <p className="text-xs text-zinc-500 mb-6">Manage projects, trigger AI reviews, or view scores</p>

        {stats && stats.recentReviews.length > 0 ? (
          <div className="space-y-4">
            {stats.recentReviews.map((review) => {
              if (!review.project) return null
              return (
                <div
                  key={review.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-zinc-950/40 border border-zinc-800/80 hover:border-zinc-700/80 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {/* Project Image */}
                    <div className="h-16 w-24 rounded-lg overflow-hidden border border-zinc-800 relative bg-zinc-900 shrink-0">
                      <img
                        src={review.project.screenshotUrl}
                        alt={review.project.title}
                        className="object-cover h-full w-full"
                      />
                    </div>
                    {/* Details */}
                    <div>
                      <h4 className="font-bold text-zinc-200 text-base leading-tight">
                        {review.project.title}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <span className="rounded bg-zinc-900 border border-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
                          {review.project.category}
                        </span>
                        <span className="rounded bg-zinc-900 border border-zinc-800 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
                          {review.mode}
                        </span>
                        <span className="text-[10px] text-zinc-500">
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
                      <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Score:</span>
                      <span className="text-xl font-extrabold text-zinc-100">
                        {review.score}.0/10
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/results/project/${review.project.id}`}
                        className="flex items-center gap-1 rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-100 hover:text-zinc-950 transition-all cursor-pointer"
                      >
                        View Review
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                      <button
                        onClick={(e) => handleDeleteProject(review.project!.id, e)}
                        className="p-2 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-red-400 hover:border-red-950 transition-colors cursor-pointer"
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
          <div className="text-center py-10 border border-dashed border-zinc-850 rounded-2xl bg-zinc-900/10">
            <p className="text-zinc-500 text-xs mb-4">No projects submitted yet.</p>
            <Link
              href="/submit"
              className="inline-flex items-center gap-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 px-5 py-2.5 text-xs font-semibold text-zinc-950 transition-colors cursor-pointer"
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
