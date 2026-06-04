'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import apiClient from '../../../utils/apiClient'
import { useAuth } from '../../../context/AuthContext'
import { ShieldCheck, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

function VerifyOtpContent() {
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendMessage, setResendMessage] = useState('')
  const { login } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  const phone = searchParams.get('phone') || ''
  const name = searchParams.get('name') || ''

  useEffect(() => {
    // If no phone number is provided, redirect back to login page
    if (!phone) {
      router.push('/login')
    }
  }, [phone, router])

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!otp) {
      setError('Verification code is required')
      return
    }

    if (otp.length !== 6 || isNaN(Number(otp))) {
      setError('Please enter a 6-digit numeric code')
      return
    }

    setLoading(true)
    setError('')
    setResendMessage('')
    try {
      const response = await apiClient.post('/api/auth/verify-otp', {
        phone,
        otp,
        name,
      })

      const { token, user } = response.data
      login(token, user)
    } catch (err: any) {
      console.error('Verify OTP Error:', err)
      setError(err.response?.data?.error || 'Invalid or expired code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setLoading(true)
    setError('')
    setResendMessage('')
    try {
      const response = await apiClient.post('/api/auth/send-otp', { phone })
      if (response.data.mockMode) {
        alert(`[Mock Mode] OTP resent to ${phone}: ${response.data.otp}`)
      }
      setResendMessage('A new verification code has been sent!')
    } catch (err: any) {
      console.error('Resend OTP Error:', err)
      setError(err.response?.data?.error || 'Failed to resend code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[75vh] items-center justify-center px-4">
      <div className="w-full max-w-md glass-panel rounded-3xl p-8 border border-white/5 shadow-2xl relative">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs text-white/40 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Login
        </Link>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">Check Your Device</h2>
          <p className="text-sm text-white/50">
            We sent a 6-digit verification code to <span className="text-purple-300 font-semibold">{phone}</span>
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 text-xs sm:text-sm text-orange-400">
            {error}
          </div>
        )}

        {resendMessage && (
          <div className="mb-6 p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-xs sm:text-sm text-purple-400">
            {resendMessage}
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-6">
          <div>
            <label className="block text-xs uppercase tracking-wider text-white/40 font-bold mb-2 text-center">
              Verification Code
            </label>
            <div className="relative flex justify-center">
              <input
                type="text"
                placeholder="123456"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                className="w-40 tracking-[0.75em] text-center font-extrabold text-2xl glass-panel rounded-xl py-3 bg-white/2 border-white/5 focus:border-purple-500/50 text-white placeholder-white/10 focus:outline-none focus:ring-0"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold py-3.5 transition-colors cursor-pointer shadow-lg shadow-purple-600/10"
          >
            <ShieldCheck className="h-5 w-5" />
            {loading ? 'Verifying...' : 'Verify Code'}
          </button>
        </form>

        <div className="text-center mt-6">
          <span className="text-xs text-white/40">Didn't receive the code? </span>
          <button
            onClick={handleResend}
            disabled={loading}
            className="text-xs text-purple-400 hover:text-purple-300 font-semibold cursor-pointer underline"
          >
            Resend Code
          </button>
        </div>
      </div>
    </div>
  )
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[75vh] items-center justify-center text-white">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"></div>
      </div>
    }>
      <VerifyOtpContent />
    </Suspense>
  )
}
