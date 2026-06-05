'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import apiClient from '../../../utils/apiClient'
import { useAuth } from '../../../context/AuthContext'
import { ShieldCheck, ArrowLeft, AlertTriangle, FileCheck } from 'lucide-react'
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
      <div className="w-full max-w-md border border-zinc-800 bg-zinc-900/40 rounded-3xl p-8 shadow-2xl relative">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-200 mb-6 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Login
        </Link>

        <div className="text-center mb-8">
          <h2 className="text-2xl font-extrabold text-zinc-100 tracking-tight mb-1">Verify Code</h2>
          <p className="text-xs text-zinc-500">
            We sent a verification code to <span className="text-zinc-350 font-semibold">{phone}</span>
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl border border-zinc-800 bg-zinc-950 text-xs sm:text-sm text-zinc-300 flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0 text-zinc-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {resendMessage && (
          <div className="mb-6 p-4 rounded-xl border border-zinc-800 bg-zinc-950 text-xs sm:text-sm text-zinc-300 flex items-start gap-2.5">
            <FileCheck className="h-4 w-4 shrink-0 text-zinc-400 mt-0.5" />
            <span>{resendMessage}</span>
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-6">
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-2 text-center">
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
                className="w-40 tracking-[0.75em] text-center font-extrabold text-2xl bg-zinc-950 border border-zinc-850 rounded-xl py-3 text-zinc-100 placeholder-zinc-800 focus:border-zinc-750 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 text-zinc-950 font-semibold py-3.5 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 focus:ring-offset-zinc-950"
          >
            <ShieldCheck className="h-5 w-5" />
            {loading ? 'Verifying...' : 'Verify Code'}
          </button>
        </form>

        <div className="text-center mt-6">
          <span className="text-xs text-zinc-500">Didn't receive the code? </span>
          <button
            onClick={handleResend}
            disabled={loading}
            className="text-xs text-zinc-300 hover:text-white font-semibold cursor-pointer underline focus:outline-none"
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
      <div className="flex min-h-[75vh] items-center justify-center bg-zinc-950 text-zinc-50 animate-pulse">
        <div className="h-6 w-32 bg-zinc-800 rounded"></div>
      </div>
    }>
      <VerifyOtpContent />
    </Suspense>
  )
}
