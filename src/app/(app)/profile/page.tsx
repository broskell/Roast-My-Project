'use client'

import React from 'react'
import { useAuth } from '../../../context/AuthContext'
import { User, LogOut, Phone, Mail, Award, KeyRound } from 'lucide-react'

export default function ProfilePage() {
  const { user, logout } = useAuth()

  if (!user) return null

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Your Profile</h1>
        <p className="text-sm text-white/50">Manage your credentials and login sessions</p>
      </div>

      <div className="glass-panel rounded-3xl p-8 border-white/5 space-y-8 relative overflow-hidden">
        {/* Decorative ambient circle */}
        <div className="absolute -top-10 -right-10 h-32 w-32 bg-purple-600/10 rounded-full blur-xl"></div>
        
        {/* User Info Header */}
        <div className="flex items-center gap-5">
          <div className="h-16 w-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <User className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{user.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="rounded bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/60 capitalize flex items-center gap-1">
                <KeyRound className="h-3 w-3" />
                {user.authType} login
              </span>
            </div>
          </div>
        </div>

        {/* Credentials list */}
        <div className="border-t border-white/5 pt-6 space-y-4">
          <h4 className="text-xs uppercase tracking-wider text-white/40 font-bold">Contact Details</h4>
          
          {user.phone && (
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/2 border border-white/5">
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-white/40" />
                <span className="text-xs uppercase tracking-wider text-white/50 font-bold">Phone Number</span>
              </div>
              <span className="text-sm text-white font-semibold">{user.phone}</span>
            </div>
          )}

          {user.email && (
            <div className="flex items-center justify-between p-4 rounded-xl bg-white/2 border border-white/5">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-white/40" />
                <span className="text-xs uppercase tracking-wider text-white/50 font-bold">Email Address</span>
              </div>
              <span className="text-sm text-white font-semibold">{user.email}</span>
            </div>
          )}
        </div>

        {/* Logout Action */}
        <div className="border-t border-white/5 pt-6 flex justify-end">
          <button
            onClick={logout}
            className="flex items-center gap-2 rounded-xl bg-orange-600/15 border border-orange-500/10 hover:bg-orange-600 hover:text-white text-orange-400 font-semibold px-6 py-3.5 transition-all cursor-pointer text-sm"
          >
            <LogOut className="h-4 w-4" />
            Logout from Session
          </button>
        </div>
      </div>
    </div>
  )
}
