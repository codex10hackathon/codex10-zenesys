import React, { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import Layout from '../components/Layout'
import Card from '../components/Card'
import { RiskBadge } from '../components/Badges'
import { useMachines } from '../hooks/useMachines'
import { getLifecycle } from '../services/lifecycleService'
import { formatCurrency, formatNumber } from '../utils/format'

function StageTracker({ stages, currentIndex }) {
  return (
    <div className="flex items-center overflow-x-auto pb-2">
      {stages.map((stage, i) => {
        const isDone = i < currentIndex
        const isCurrent = i === currentIndex
        return (
          <React.Fragment key={stage}>
            <div className="flex min-w-[104px] flex-col items-center text-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-[12px] font-semibold ${
                  isDone
                    ? 'border-navy-700 bg-navy-700 text-white'
                    : isCurrent
                    ? 'border-navy-700 bg-white text-navy-700'
                    : 'border-[var(--border-strong)] bg-white text-[var(--text-muted)]'
                }`}
              >
                {isDone ? <Check size={15} /> : i + 1}
              </div>
              <span
                className={`mt-2 text-[11.5px] font-medium leading-tight ${
                  isCurrent ? 'text-navy-700' : isDone ? 'text-[var(--text-primary)]' : 'text-[var(--text-muted)]'
                }`}
              >
                {stage}
              </span>
            </div>
            {i < stages.length - 1 && (
              <div className={`mx-1 h-0.5 w-10 shrink-0 ${i < currentIndex ? 'bg-navy-700' : 'bg-[var(--border-strong)]'}`} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

export default function Lifecycle() {
  const { machines } = useMachines()
  const [selectedId, setSelectedId] = useState('')
  const [lifecycle, setLifecycle] = useState(null)

  useEffect(() => {
    if (machines.length > 0 && !selectedId) {
      setSelectedId(machines[0].id)
    }
  }, [machines, selectedId])

  useEffect(() => {
    if (selectedId) {
      getLifecycle(selectedId).then(setLifecycle)
    }
  }, [selectedId])

  return (
    <Layout title="Lifecycle" subtitle="Track an asset through its full operational lifecycle">
      <Card
        title="Select Machine"
        actions={
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="rounded border border-[var(--border-strong)] bg-white px-3 py-1.5 text-[13px] focus-ring"
          >
            {machines.map((m) => (
              <option key={m.id} value={m.id}>
                {m.id} — {m.machine_type}
              </option>
            ))}
          </select>
        }
      >
        {lifecycle && <StageTracker stages={lifecycle.stages} currentIndex={lifecycle.current_index} />}
      </Card>

      {lifecycle && (
        <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-3">
          <Card title="Lifecycle Metrics" className="xl:col-span-2">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                { label: 'Machine Age', value: `${formatNumber(lifecycle.machine_age_years, 1)} yrs` },
                { label: 'Operating Hours', value: lifecycle.operating_hours.toLocaleString('en-IN') },
                { label: 'Failures', value: lifecycle.failures },
                { label: 'Maintenance Cost', value: formatCurrency(lifecycle.maintenance_cost) },
                { label: 'Repair Cost', value: formatCurrency(lifecycle.repair_cost) },
                { label: 'RUL', value: `${formatNumber(lifecycle.rul_hours, 0)} h` },
                { label: 'Health', value: `${lifecycle.health_score}/100` },
              ].map((item) => (
                <div key={item.label} className="rounded border border-[var(--border-subtle)] bg-[var(--bg-app)] px-4 py-3">
                  <p className="text-[11.5px] font-medium uppercase tracking-wide text-[var(--text-muted)]">{item.label}</p>
                  <p className="mt-1 text-[17px] font-semibold tabular-nums text-[var(--text-primary)]">{item.value}</p>
                </div>
              ))}
              <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-app)] px-4 py-3">
                <p className="text-[11.5px] font-medium uppercase tracking-wide text-[var(--text-muted)]">Risk</p>
                <div className="mt-1.5">
                  <RiskBadge risk={lifecycle.risk_level} />
                </div>
              </div>
            </div>
          </Card>

          <Card title="Lifecycle Recommendation">
            <div className="rounded border border-navy-100 bg-navy-50 p-4">
              <p className="mb-1 text-[12px] font-semibold uppercase tracking-wide text-navy-700">Current Stage</p>
              <p className="mb-3 text-[15px] font-semibold text-[var(--text-primary)]">{lifecycle.current_stage}</p>
              <p className="text-[13px] leading-relaxed text-[var(--text-secondary)]">{lifecycle.recommendation}</p>
            </div>
          </Card>
        </div>
      )}
    </Layout>
  )
}
