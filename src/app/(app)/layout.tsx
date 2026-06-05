'use client'

import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { AuthProvider, useAuth } from '../../context/AuthContext'
import Link from 'next/link'
import { LogOut, LayoutDashboard, Send, FileText, User as UserIcon, ShieldAlert, Flame, Search } from 'lucide-react'

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
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-zinc-100 hover:text-white transition-colors">
          <Flame className="h-5 w-5 text-zinc-100" />
          <span className="tracking-tight font-extrabold">Roast My Project</span>
        </Link>

        <nav className="flex items-center gap-4 sm:gap-6">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 text-sm font-medium text-zinc-400 hover:text-zinc-100 transition-colors"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
              <Link
                href="/idea-research"
                className="flex items-center gap-1.5 text-sm font-medium text-zinc-400 hover:text-zinc-100 transition-colors"
              >
                <Search className="h-4 w-4" />
                <span className="hidden sm:inline">Idea Research</span>
              </Link>
              <Link
                href="/submit"
                className="flex items-center gap-1.5 text-sm font-medium text-zinc-400 hover:text-zinc-100 transition-colors"
              >
                <Send className="h-4 w-4" />
                <span className="hidden sm:inline">Submit Project</span>
              </Link>
              <Link
                href="/resume"
                className="flex items-center gap-1.5 text-sm font-medium text-zinc-400 hover:text-zinc-100 transition-colors"
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Roast Resume</span>
              </Link>
              <a
                href="/admin"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-sm font-medium text-zinc-400 hover:text-zinc-100 transition-colors"
              >
                <ShieldAlert className="h-4 w-4" />
                <span className="hidden sm:inline">CMS Admin</span>
              </a>
              <Link
                href="/profile"
                className="flex items-center gap-1.5 text-sm font-medium text-zinc-400 hover:text-zinc-100 transition-colors"
              >
                <UserIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Profile</span>
              </Link>
              <button
                onClick={logout}
                className="flex items-center gap-1.5 rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition-all cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-950 hover:bg-zinc-200 transition-colors cursor-pointer"
            >
              Get Started
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
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-1 bg-zinc-800 w-32 rounded-full overflow-hidden relative">
            <div className="h-full bg-zinc-100 rounded-full w-1/2 animate-[pulse_1.5s_infinite]"></div>
          </div>
          <p className="text-xs font-semibold text-zinc-500 animate-pulse tracking-wide">Loading platform...</p>
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
      <footer className="w-full border-t border-zinc-800 py-6 bg-zinc-950 text-center text-xs text-zinc-500">
        <p>© {new Date().getFullYear()} Roast My Project. Built with Gemini & Payload 3.x.</p>
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
