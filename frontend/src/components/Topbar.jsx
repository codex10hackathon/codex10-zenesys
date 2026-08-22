import React from 'react'
import { Bell, Search } from 'lucide-react'

export default function Topbar({ title, subtitle, actions }) {
  return (
    <header className="flex items-center justify-between border-b border-[var(--border-subtle)] bg-white px-7 py-4">
      <div>
        <h1 className="text-[18px] font-semibold leading-tight text-[var(--text-primary)]">{title}</h1>
        {subtitle && <p className="mt-0.5 text-[13px] text-[var(--text-secondary)]">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-app)] px-3 py-1.5 text-[13px] text-[var(--text-muted)] md:flex">
          <Search size={14} />
          <span>Search assets…</span>
        </div>
        <button className="relative flex h-9 w-9 items-center justify-center rounded-md border border-[var(--border-subtle)] bg-white text-[var(--text-secondary)] hover:bg-[var(--bg-app)] focus-ring">
          <Bell size={16} />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-status-critical" />
        </button>
        {actions}
      </div>
    </header>
  )
}
