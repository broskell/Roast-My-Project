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
        background: '#110c1c', 
        border: '1px solid rgba(255,255,255,0.06)', 
        borderRadius: '12px', 
        marginBottom: '24px', 
        color: 'rgba(255,255,255,0.6)',
        fontSize: '13px'
      }}>
        Loading System Analytics...
      </div>
    )
  }

  return (
    <div style={{ 
      padding: '24px', 
      background: '#110c1c', 
      border: '1px solid rgba(255,255,255,0.06)', 
      borderRadius: '12px', 
      marginBottom: '24px', 
      color: '#fff',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 4px 0' }}>System Overview</h2>
      <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', margin: '0 0 20px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Real-time database statistics across all collections
      </p>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
        gap: '16px' 
      }}>
        {/* Users Count Card */}
        <div style={{ 
          padding: '16px 20px', 
          background: 'rgba(255,255,255,0.02)', 
          border: '1px solid rgba(255,255,255,0.04)', 
          borderRadius: '8px' 
        }}>
          <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', letterSpacing: '0.05em' }}>
            Total Registered Users
          </span>
          <p style={{ fontSize: '28px', fontWeight: '800', margin: '6px 0 0 0', color: '#c084fc' }}>
            {stats?.totalUsers || 0}
          </p>
        </div>

        {/* Projects Count Card */}
        <div style={{ 
          padding: '16px 20px', 
          background: 'rgba(255,255,255,0.02)', 
          border: '1px solid rgba(255,255,255,0.04)', 
          borderRadius: '8px' 
        }}>
          <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', letterSpacing: '0.05em' }}>
            Total Projects Uploaded
          </span>
          <p style={{ fontSize: '28px', fontWeight: '800', margin: '6px 0 0 0', color: '#fb923c' }}>
            {stats?.totalProjects || 0}
          </p>
        </div>

        {/* Reviews Count Card */}
        <div style={{ 
          padding: '16px 20px', 
          background: 'rgba(255,255,255,0.02)', 
          border: '1px solid rgba(255,255,255,0.04)', 
          borderRadius: '8px' 
        }}>
          <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontWeight: 'bold', letterSpacing: '0.05em' }}>
            Total AI Reviews Run
          </span>
          <p style={{ fontSize: '28px', fontWeight: '800', margin: '6px 0 0 0', color: '#60a5fa' }}>
            {stats?.totalReviews || 0}
          </p>
        </div>
      </div>
    </div>
  )
}
