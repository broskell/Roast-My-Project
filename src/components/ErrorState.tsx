import React from 'react'
import { AlertCircle } from 'lucide-react'

interface ErrorStateProps {
  title?: string
  description?: string
  onRetry?: () => void
  retryLabel?: string
}

export default function ErrorState({
  title = 'An error occurred',
  description = 'Something went wrong while fetching data. Please try again.',
  onRetry,
  retryLabel = 'Try Again'
}: ErrorStateProps) {
  return (
    <div className="w-full max-w-lg mx-auto p-6 rounded-xl border border-zinc-800 bg-zinc-950 flex flex-col items-center text-center space-y-4 shadow-sm">
      <div className="p-3 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400">
        <AlertCircle className="h-6 w-6" />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-sm font-semibold text-zinc-100">{title}</h3>
        <p className="text-xs text-zinc-400 max-w-sm leading-relaxed whitespace-pre-line">{description}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-semibold px-4 py-2 text-xs transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 focus:ring-offset-zinc-950"
        >
          {retryLabel}
        </button>
      )}
    </div>
  )
}
