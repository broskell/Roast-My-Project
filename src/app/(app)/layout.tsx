'use client'

import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { AuthProvider, useAuth } from '../../context/AuthContext'
import Link from 'next/link'
import { LogOut, LayoutDashboard, Send, FileText, User as UserIcon, ShieldAlert } from 'lucide-react'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

function Navigation() {
  const { user, logout } = useAuth()

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-background/50 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-white">
          <span className="text-2xl animate-pulse">🔥</span>
          <span className="tracking-tight text-gradient-purple font-extrabold">Roast My Project</span>
        </Link>

        <nav className="flex items-center gap-4 sm:gap-6">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 text-sm font-medium text-white/80 hover:text-white transition-colors"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
              <Link
                href="/submit"
                className="flex items-center gap-1.5 text-sm font-medium text-white/80 hover:text-white transition-colors"
              >
                <Send className="h-4 w-4" />
                <span className="hidden sm:inline">Submit Project</span>
              </Link>
              <Link
                href="/resume"
                className="flex items-center gap-1.5 text-sm font-medium text-white/80 hover:text-white transition-colors"
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Roast Resume</span>
              </Link>
              <a
                href="/admin"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors"
              >
                <ShieldAlert className="h-4 w-4" />
                <span className="hidden sm:inline">CMS Admin</span>
              </a>
              <Link
                href="/profile"
                className="flex items-center gap-1.5 text-sm font-medium text-white/80 hover:text-white transition-colors"
              >
                <UserIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Profile</span>
              </Link>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-sm font-medium text-orange-400 hover:bg-orange-500/10 hover:border-orange-500/20 transition-all cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 transition-colors shadow-lg shadow-purple-600/20 cursor-pointer"
            >
              Get Roasted
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}

function InnerLayout({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0914] text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"></div>
          <p className="text-sm font-medium text-purple-300/80">Igniting thrusters...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Navigation />
      <main className="flex-1 container mx-auto px-4 py-8 sm:px-6 relative z-10">
        {children}
      </main>
      <footer className="w-full border-t border-white/5 py-6 bg-background/30 text-center text-sm text-white/40">
        <p>© {new Date().getFullYear()} Roast My Project. Built with 🔥, Gemini, & Payload 3.x.</p>
      </footer>
    </>
  )
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <InnerLayout>{children}</InnerLayout>
        </AuthProvider>
      </body>
    </html>
  )
}
