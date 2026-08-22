import React, { useEffect, useState } from 'react'
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { Info } from 'lucide-react'
import Layout from '../components/Layout'
import Card from '../components/Card'
import { useMachines } from '../hooks/useMachines'
import { getResaleValuation } from '../services/api'
import { formatCurrency } from '../utils/format'

export default function Resale() {
  const { machines } = useMachines()
  const [selectedId, setSelectedId] = useState('')
  const [valuation, setValuation] = useState(null)

  useEffect(() => {
    if (machines.length > 0 && !selectedId) setSelectedId(machines[0].id)
  }, [machines, selectedId])

  useEffect(() => {
    if (selectedId) getResaleValuation(selectedId).then(setValuation)
  }, [selectedId])

  return (
    <Layout title="Resale" subtitle="Model-based resale valuation and depreciation outlook">
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
        <div className="flex items-start gap-2 rounded border border-navy-100 bg-navy-50 px-3.5 py-2.5 text-[12.5px] text-navy-700">
          <Info size={15} className="mt-0.5 shrink-0" />
          <span>Estimated Resale Value — a model-based approximation. This is not an actual market price or appraisal.</span>
        </div>
      </Card>

      {valuation && (
        <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-3">
          <div className="grid grid-cols-2 gap-4 xl:col-span-2 xl:grid-cols-4">
            {valuation.projection.map((p) => (
              <div key={p.year} className="rounded-md border border-[var(--border-subtle)] bg-white p-4 shadow-card">
                <p className="text-[11.5px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
                  {p.year === 'Current' ? 'Current Estimated Value' : `${p.year.replace('+', '')} Estimated Value`}
                </p>
                <p className="mt-2 text-[20px] font-semibold tabular-nums text-[var(--text-primary)]">{formatCurrency(p.value)}</p>
              </div>
            ))}

            <Card title="Depreciation Outlook" subtitle="Projected estimated value over time" className="col-span-2 xl:col-span-4">
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={valuation.projection} margin={{ left: 0, right: 8 }}>
                    <defs>
                      <linearGradient id="resaleGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2c4f74" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#2c4f74" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eceff2" vertical={false} />
                    <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#8993a1' }} axisLine={{ stroke: '#e3e6eb' }} tickLine={false} />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#8993a1' }}
                      axisLine={false}
                      tickLine={false}
                      width={60}
                      tickFormatter={(v) => `₹${Math.round(v / 1000)}k`}
                    />
                    <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #e3e6eb' }} />
                    <Area type="monotone" dataKey="value" stroke="#2c4f74" strokeWidth={2} fill="url(#resaleGrad)" name="Estimated Value" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          <Card title="Value Factors" subtitle="Inputs behind the valuation model">
            <ul className="space-y-3">
              {valuation.factors.map((f) => (
                <li key={f.label} className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="text-[13px] font-medium text-[var(--text-primary)]">{f.label}</p>
                    <p className="text-[12px] text-[var(--text-muted)]">{f.detail}</p>
                  </div>
                  <span
                    className={`text-[11.5px] font-semibold uppercase tracking-wide ${
                      f.impact === 'Positive'
                        ? 'text-status-healthy'
                        : f.impact === 'Negative'
                        ? 'text-status-critical'
                        : 'text-[var(--text-muted)]'
                    }`}
                  >
                    {f.impact}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4 rounded border border-[var(--border-subtle)] bg-[var(--bg-app)] p-3.5">
              <p className="text-[13px] leading-relaxed text-[var(--text-secondary)]">{valuation.sell_recommendation}</p>
            </div>
          </Card>
        </div>
      )}
    </Layout>
  )
}
