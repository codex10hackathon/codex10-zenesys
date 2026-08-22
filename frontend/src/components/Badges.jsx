import React from 'react'
import { statusMeta, riskMeta } from '../utils/format'

export function StatusBadge({ status }) {
  const meta = statusMeta(status)
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 text-[11.5px] font-semibold uppercase tracking-wide"
      style={{ color: meta.color, backgroundColor: meta.bg, borderColor: meta.border }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
      {meta.label}
    </span>
  )
}

export function RiskBadge({ risk }) {
  const meta = riskMeta(risk)
  return (
    <span
      className="inline-flex items-center rounded-sm border px-2 py-0.5 text-[11.5px] font-semibold uppercase tracking-wide"
      style={{ color: meta.color, backgroundColor: meta.bg, borderColor: meta.border }}
    >
      {meta.label}
    </span>
  )
}

export function OperatingModeBadge({ mode }) {
  const map = {
    RUNNING: { color: '#1f8a4c', bg: '#e9f6ee' },
    IDLE: { color: '#5b6675', bg: '#eef0f3' },
    STANDBY: { color: '#8a6d1f', bg: '#faf3e3' },
  }
  const meta = map[mode] || map.IDLE
  return (
    <span
      className="inline-flex items-center rounded-sm px-2 py-0.5 text-[11.5px] font-semibold uppercase tracking-wide"
      style={{ color: meta.color, backgroundColor: meta.bg }}
    >
      {mode}
    </span>
  )
}
