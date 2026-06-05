'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signInWithPopup } from 'firebase/auth'
import { auth, googleProvider } from '../../../utils/firebase'
import apiClient from '../../../utils/apiClient'
import { useAuth } from '../../../context/AuthContext'
import { Phone, User as UserIcon, AlertTriangle } from 'lucide-react'

export default function LoginPage() {
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const router = useRouter()

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError('')
    try {
      const result = await signInWithPopup(auth, googleProvider)
      const idToken = await result.user.getIdToken()
      
      const response = await apiClient.post('/api/auth/firebase-login', { idToken })
      const { token, user } = response.data
      
      login(token, user)
    } catch (err: any) {
      console.error('Google Sign-In Error:', err)
      setError(err.response?.data?.error || err.message || 'Google Sign-In failed')
    } finally {
      setLoading(false)
    }
  }

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone) {
      setError('Phone number is required')
      return
    }
    
    const phoneRegex = /^\+?[1-9]\d{1,14}$/
    const cleanPhone = phone.replace(/\s+/g, '')
    if (!phoneRegex.test(cleanPhone)) {
      setError('Please enter a valid international phone number (e.g. +15551234567)')
      return
    }

    setLoading(true)
    setError('')
    try {
      const response = await apiClient.post('/api/auth/send-otp', { phone: cleanPhone })
      
      if (response.data.mockMode) {
        alert(`[Mock Mode] OTP sent to ${cleanPhone}: ${response.data.otp}`)
      }
      
      router.push(`/verify-otp?phone=${encodeURIComponent(cleanPhone)}&name=${encodeURIComponent(name)}`)
    } catch (err: any) {
      console.error('Send OTP Error:', err)
      setError(err.response?.data?.error || 'Failed to send verification code. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[75vh] items-center justify-center px-4">
      <div className="w-full max-w-md border border-zinc-800 bg-zinc-900/40 rounded-3xl p-8 shadow-2xl relative">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-extrabold text-zinc-100 tracking-tight mb-1">Authenticate</h2>
          <p className="text-xs text-zinc-500">Access the review workspace and developer tools</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl border border-zinc-800 bg-zinc-950 text-xs sm:text-sm text-zinc-300 flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0 text-zinc-400 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Google Login */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-100 font-semibold py-3.5 px-4 hover:bg-zinc-900 disabled:opacity-50 transition-colors mb-6 cursor-pointer"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.44 0-6.228-2.788-6.228-6.228 0-3.44 2.788-6.228 6.228-6.228 1.498 0 2.868.528 3.96 1.405l3.107-3.107C18.847 1.83 15.753 1 12.24 1 6.033 1 1 6.033 1 12.24s5.033 11.24 11.24 11.24c5.898 0 10.974-4.24 10.974-11.24 0-.768-.078-1.5-.228-1.955H12.24z"
            />
          </svg>
          Sign in with Google
        </button>

        {/* Divider */}
        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-[1px] bg-zinc-800"></div>
          <span className="text-[10px] uppercase tracking-widest text-zinc-550 font-bold">Or use phone</span>
          <div className="flex-1 h-[1px] bg-zinc-800"></div>
        </div>

        {/* Phone Form */}
        <form onSubmit={handlePhoneSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-1.5">
              Full Name (Optional)
            </label>
            <div className="relative">
              <UserIcon className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-650" />
              <input
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-zinc-100 placeholder-zinc-700 text-sm focus:border-zinc-750 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase tracking-wider text-zinc-500 font-bold mb-1.5">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-3.5 h-4 w-4 text-zinc-650" />
              <input
                type="tel"
                placeholder="+15551234567"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-10 pr-4 py-3 text-zinc-100 placeholder-zinc-700 text-sm focus:border-zinc-750 focus:outline-none transition-colors"
              />
            </div>
            <p className="text-[10px] text-zinc-500 mt-1.5">
              Include country code (e.g. +1 for US/Canada, +91 for India).
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 text-zinc-950 font-semibold py-3.5 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 focus:ring-offset-zinc-950"
          >
            {loading ? 'Sending...' : 'Send Verification Code'}
          </button>
        </form>
      </div>
    </div>
  )
}
