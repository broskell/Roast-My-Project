'use client'

import React, { useEffect, useState } from 'react'

export function AdminAnalytics() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStats(data.stats)
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error('Error fetching admin stats:', err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div style={{ 
        padding: '20px', 
        background: '#18181b', 
        border: '1px solid #27272a', 
        borderRadius: '12px', 
        marginBottom: '24px', 
        color: '#a1a1aa',
        fontSize: '13px',
        animation: 'pulse 1.5s infinite'
      }}>
        Loading System Analytics...
      </div>
    )
  }

  return (
    <div style={{ 
      padding: '24px', 
      background: '#18181b', 
      border: '1px solid #27272a', 
      borderRadius: '12px', 
      marginBottom: '24px', 
      color: '#fafafa',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <h2 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 4px 0', color: '#fafafa' }}>System Overview</h2>
      <p style={{ fontSize: '10px', color: '#71717a', margin: '0 0 20px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Database statistics across collections
      </p>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
        gap: '16px' 
      }}>
        {/* Users Count Card */}
        <div style={{ 
          padding: '16px 20px', 
          background: '#09090b', 
          border: '1px solid #27272a', 
          borderRadius: '8px' 
        }}>
          <span style={{ fontSize: '9px', textTransform: 'uppercase', color: '#71717a', fontWeight: 'bold', letterSpacing: '0.05em' }}>
            Registered Users
          </span>
          <p style={{ fontSize: '26px', fontWeight: '800', margin: '6px 0 0 0', color: '#fafafa' }}>
            {stats?.totalUsers || 0}
          </p>
        </div>

        {/* Projects Count Card */}
        <div style={{ 
          padding: '16px 20px', 
          background: '#09090b', 
          border: '1px solid #27272a', 
          borderRadius: '8px' 
        }}>
          <span style={{ fontSize: '9px', textTransform: 'uppercase', color: '#71717a', fontWeight: 'bold', letterSpacing: '0.05em' }}>
            Projects Uploaded
          </span>
          <p style={{ fontSize: '26px', fontWeight: '800', margin: '6px 0 0 0', color: '#fafafa' }}>
            {stats?.totalProjects || 0}
          </p>
        </div>

        {/* Reviews Count Card */}
        <div style={{ 
          padding: '16px 20px', 
          background: '#09090b', 
          border: '1px solid #27272a', 
          borderRadius: '8px' 
        }}>
          <span style={{ fontSize: '9px', textTransform: 'uppercase', color: '#71717a', fontWeight: 'bold', letterSpacing: '0.05em' }}>
            AI Reviews Run
          </span>
          <p style={{ fontSize: '26px', fontWeight: '800', margin: '6px 0 0 0', color: '#fafafa' }}>
            {stats?.totalReviews || 0}
          </p>
        </div>
      </div>
    </div>
  )
}
