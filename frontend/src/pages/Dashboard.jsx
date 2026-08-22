import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Boxes,
  ShieldCheck,
  AlertTriangle,
  Siren,
  CalendarClock,
  Gauge,
  Percent,
  IndianRupee,
} from 'lucide-react'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import Layout from '../components/Layout'
import Card from '../components/Card'
import StatCard from '../components/StatCard'
import { RiskBadge, StatusBadge } from '../components/Badges'
import { getMachineSummary, getHighRiskMachines, getUpcoming } from '../services/api'
import { getSensorHistory } from '../data/machines'
import { formatCurrency, formatDateDisplay, formatNumber } from '../utils/format'

const HEALTH_COLORS = { Healthy: '#1f8a4c', Watch: '#c9a227', 'At Risk': '#c9670c', Critical: '#c02929' }

export default function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [highRisk, setHighRisk] = useState([])
  const [upcoming, setUpcoming] = useState([])
  const [trend, setTrend] = useState([])

  useEffect(() => {
    getMachineSummary().then(setSummary)
    getHighRiskMachines(6).then(setHighRisk)
    getUpcoming().then(setUpcoming)
  }, [])

  useEffect(() => {
    if (highRisk.length > 0) {
      setTrend(getSensorHistory(highRisk[0].id))
    }
  }, [highRisk])

  const pieData = summary
    ? [
        { name: 'Healthy', value: summary.healthy },
        { name: 'Watch', value: summary.total - summary.healthy - summary.atRisk - summary.critical },
        { name: 'At Risk', value: summary.atRisk },
        { name: 'Critical', value: summary.critical },
      ].filter((d) => d.value > 0)
    : []

  return (
    <Layout title="Dashboard" subtitle="Fleet-wide health, risk and maintenance overview">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-8">
        <StatCard label="Total Machines" value={summary?.total ?? '—'} icon={Boxes} tone="neutral" />
        <StatCard label="Healthy" value={summary?.healthy ?? '—'} icon={ShieldCheck} tone="healthy" />
        <StatCard label="At Risk" value={summary?.atRisk ?? '—'} icon={AlertTriangle} tone="risk" />
        <StatCard label="Critical" value={summary?.critical ?? '—'} icon={Siren} tone="critical" />
        <StatCard label="Maintenance Due" value={summary?.maintenanceDue ?? '—'} icon={CalendarClock} tone="watch" />
        <StatCard label="Avg. RUL" value={summary ? formatNumber(summary.avgRul, 0) : '—'} unit="hrs" icon={Gauge} tone="neutral" />
        <StatCard label="Avg. Failure Risk" value={summary ? formatNumber(summary.avgRisk, 1) : '—'} unit="%" icon={Percent} tone="risk" />
        <StatCard label="Repair Cost" value={summary ? formatCurrency(summary.totalRepairCost) : '—'} icon={IndianRupee} tone="neutral" />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Card title="Asset Health" subtitle="Fleet distribution by condition" className="xl:col-span-1">
          <div className="flex items-center gap-6">
            <div className="h-44 w-44 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={72} paddingAngle={2}>
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={HEALTH_COLORS[entry.name]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #e3e6eb' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="space-y-2.5">
              {pieData.map((d) => (
                <li key={d.name} className="flex items-center gap-2 text-[13px]">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: HEALTH_COLORS[d.name] }} />
                  <span className="text-[var(--text-secondary)]">{d.name}</span>
                  <span className="ml-auto font-semibold tabular-nums text-[var(--text-primary)]">{d.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        <Card title="Asset Health Trend" subtitle={highRisk[0] ? `Highest-risk asset — ${highRisk[0].id}` : ''} className="xl:col-span-2">
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ left: -18, top: 4, right: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="healthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2c4f74" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#2c4f74" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#eceff2" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#8993a1' }} axisLine={{ stroke: '#e3e6eb' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#8993a1' }} axisLine={false} tickLine={false} width={30} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #e3e6eb' }} />
                <Area type="monotone" dataKey="health" stroke="#2c4f74" strokeWidth={2} fill="url(#healthGrad)" name="Health Score" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Card
          title="High-Risk Machines"
          subtitle="Sorted by predicted failure probability"
          className="xl:col-span-2"
          noPadding
          bodyClassName=""
        >
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] text-[11.5px] uppercase tracking-wide text-[var(--text-muted)]">
                <th className="px-5 py-2.5 font-medium">Machine ID</th>
                <th className="px-5 py-2.5 font-medium">Type</th>
                <th className="px-5 py-2.5 font-medium">Risk</th>
                <th className="px-5 py-2.5 font-medium">RUL</th>
                <th className="px-5 py-2.5 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {highRisk.map((m) => (
                <tr key={m.id} className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--bg-app)]">
                  <td className="px-5 py-2.5 font-medium text-[var(--text-primary)]">{m.id}</td>
                  <td className="px-5 py-2.5 text-[var(--text-secondary)]">{m.machine_type}</td>
                  <td className="px-5 py-2.5">
                    <RiskBadge risk={m.risk_level} />
                  </td>
                  <td className="px-5 py-2.5 tabular-nums text-[var(--text-secondary)]">{formatNumber(m.rul_hours, 0)} h</td>
                  <td className="px-5 py-2.5 text-right">
                    <Link to={`/machines/${m.id}`} className="text-[12.5px] font-medium text-navy-600 hover:underline">
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card title="Upcoming Maintenance" subtitle="Next scheduled or overdue" noPadding>
          <ul className="divide-y divide-[var(--border-subtle)]">
            {upcoming.map((m) => (
              <li key={m.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-[13px] font-medium text-[var(--text-primary)]">{m.id}</p>
                  <p className="text-[12px] text-[var(--text-muted)]">{formatDateDisplay(m.next_maintenance_date)}</p>
                </div>
                <StatusBadge status={m.maintenance_overdue ? 'CRITICAL' : m.status} />
              </li>
            ))}
            {upcoming.length === 0 && <li className="px-5 py-4 text-[13px] text-[var(--text-muted)]">Nothing scheduled.</li>}
          </ul>
        </Card>
      </div>
    </Layout>
  )
}
