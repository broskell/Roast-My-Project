'use client'

import React from 'react'
import { useAuth } from '../../../context/AuthContext'
import { User, LogOut, Phone, Mail, KeyRound } from 'lucide-react'

export default function ProfilePage() {
  const { user, logout } = useAuth()

  if (!user) return null

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-zinc-100 tracking-tight">Profile Settings</h1>
        <p className="text-xs text-zinc-500">Manage credentials and active sessions</p>
      </div>

      <div className="border border-zinc-800 bg-zinc-900/40 rounded-3xl p-8 space-y-8 relative overflow-hidden">
        
        {/* User Info Header */}
        <div className="flex items-center gap-5">
          <div className="h-16 w-16 rounded-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center text-zinc-400">
            <User className="h-8 w-8" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-zinc-100">{user.name || 'Anonymous User'}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="rounded bg-zinc-950 border border-zinc-850 px-2 py-0.5 text-[10px] font-semibold text-zinc-400 capitalize flex items-center gap-1">
                <KeyRound className="h-3 w-3" />
                {user.authType} login
              </span>
            </div>
          </div>
        </div>

        {/* Credentials list */}
        <div className="border-t border-zinc-800 pt-6 space-y-4">
          <h4 className="text-[10px] uppercase tracking-wider text-zinc-500 font-bold">Account Registry</h4>
          
          {user.phone && (
            <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-950/40 border border-zinc-800">
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-zinc-500" />
                <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Phone Number</span>
              </div>
              <span className="text-sm text-zinc-300 font-semibold">{user.phone}</span>
            </div>
          )}

          {user.email && (
            <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-950/40 border border-zinc-800">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-zinc-500" />
                <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold">Email Address</span>
              </div>
              <span className="text-sm text-zinc-300 font-semibold">{user.email}</span>
            </div>
          )}
        </div>

        {/* Logout Action */}
        <div className="border-t border-zinc-800 pt-6 flex justify-end">
          <button
            onClick={logout}
            className="flex items-center gap-2 rounded-xl bg-zinc-950 border border-zinc-800 hover:bg-red-950/40 hover:border-red-900 hover:text-red-200 text-zinc-400 font-semibold px-6 py-3.5 transition-colors cursor-pointer text-xs"
          >
            <LogOut className="h-4 w-4" />
            Logout from Session
          </button>
        </div>
      </div>
    </div>
  )
}
