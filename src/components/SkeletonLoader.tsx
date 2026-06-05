import React from 'react'

export function CardSkeleton() {
  return (
    <div className="w-full rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-4 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="h-3.5 w-24 bg-zinc-800 rounded"></div>
        <div className="h-5 w-5 bg-zinc-800 rounded-full"></div>
      </div>
      <div className="h-8 w-16 bg-zinc-800 rounded"></div>
      <div className="h-3 w-36 bg-zinc-800 rounded"></div>
    </div>
  )
}

export function GraphSkeleton() {
  return (
    <div className="w-full rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-4 animate-pulse min-h-[350px] flex flex-col justify-between">
      <div className="space-y-2">
        <div className="h-4.5 w-32 bg-zinc-800 rounded"></div>
        <div className="h-3 w-48 bg-zinc-800 rounded"></div>
      </div>
      <div className="flex-1 w-full bg-zinc-900/60 rounded-lg flex items-end gap-2 p-2 mt-4 min-h-[220px]">
        <div className="flex-1 h-1/4 bg-zinc-800 rounded"></div>
        <div className="flex-1 h-2/5 bg-zinc-800 rounded"></div>
        <div className="flex-1 h-3/5 bg-zinc-800 rounded"></div>
        <div className="flex-1 h-1/2 bg-zinc-800 rounded"></div>
        <div className="flex-1 h-4/5 bg-zinc-800 rounded"></div>
      </div>
    </div>
  )
}

export function ListSkeleton() {
  return (
    <div className="w-full rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 space-y-4 animate-pulse">
      <div className="h-4.5 w-40 bg-zinc-800 rounded mb-6"></div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex justify-between items-center p-4 rounded-xl border border-zinc-800 bg-zinc-950/40">
            <div className="flex items-center gap-4">
              <div className="h-12 w-20 bg-zinc-800 rounded-lg"></div>
              <div className="space-y-2">
                <div className="h-3.5 w-32 bg-zinc-800 rounded"></div>
                <div className="h-2.5 w-20 bg-zinc-800 rounded"></div>
              </div>
            </div>
            <div className="h-7.5 w-20 bg-zinc-800 rounded-lg"></div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function PageSkeleton() {
  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-pulse py-4">
      <div className="flex justify-between items-center">
        <div className="h-4 w-20 bg-zinc-800 rounded"></div>
        <div className="h-6 w-32 bg-zinc-800 rounded-full"></div>
      </div>
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 flex flex-col md:flex-row gap-6">
        <div className="h-28 w-44 bg-zinc-800 rounded-xl"></div>
        <div className="flex-1 space-y-3">
          <div className="h-6 w-48 bg-zinc-800 rounded"></div>
          <div className="h-3 w-full bg-zinc-800 rounded"></div>
          <div className="h-3 w-2/3 bg-zinc-800 rounded"></div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 h-48"></div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 h-48"></div>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 h-96"></div>
      </div>
    </div>
  )
}
