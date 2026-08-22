import React from 'react'

export default function StatCard({ label, value, unit, icon: Icon, tone = 'neutral', trend }) {
  const toneMap = {
    neutral: 'text-navy-700 bg-navy-50',
    healthy: 'text-status-healthy bg-[#e9f6ee]',
    watch: 'text-status-watch bg-[#faf3e3]',
    risk: 'text-status-risk bg-[#fdf0e5]',
    critical: 'text-status-critical bg-[#fceaea]',
  }

  return (
    <div className="rounded-md border border-[var(--border-subtle)] bg-white p-4 shadow-card">
      <div className="flex items-start justify-between">
        <p className="text-[12px] font-medium uppercase tracking-wide text-[var(--text-muted)]">{label}</p>
        {Icon && (
          <div className={`flex h-7 w-7 items-center justify-center rounded ${toneMap[tone]}`}>
            <Icon size={14} strokeWidth={2.2} />
          </div>
        )}
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="tabular-nums text-[24px] font-semibold text-[var(--text-primary)]">{value}</span>
        {unit && <span className="text-[13px] text-[var(--text-muted)]">{unit}</span>}
      </div>
      {trend && <p className="mt-1 text-[12px] text-[var(--text-muted)]">{trend}</p>}
    </div>
  )
}
