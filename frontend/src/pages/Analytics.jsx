import React, { useEffect, useMemo, useState } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts'
import Layout from '../components/Layout'
import Card from '../components/Card'
import { useMachines } from '../hooks/useMachines'
import { getSensorHistory } from '../data/machines'
import { formatCurrency } from '../utils/format'

const FAILURE_COLORS = ['#c02929', '#c9670c', '#c9a227', '#5c86ac', '#8a6d1f']

export default function Analytics() {
  const { machines } = useMachines()
  const [sensorTrend, setSensorTrend] = useState([])

  useEffect(() => {
    if (machines.length > 0) {
      // Highest-risk machine drives the sensor trend chart
      const top = [...machines].sort((a, b) => b.failure_probability - a.failure_probability)[0]
      setSensorTrend(getSensorHistory(top.id))
    }
  }, [machines])

  const healthByType = useMemo(() => {
    const byType = {}
    machines.forEach((m) => {
      byType[m.machine_type] = byType[m.machine_type] || { type: m.machine_type, total: 0, count: 0 }
      byType[m.machine_type].total += m.health_score
      byType[m.machine_type].count += 1
    })
    return Object.values(byType).map((t) => ({ type: t.type, avgHealth: Math.round(t.total / t.count) }))
  }, [machines])

  const failureTypeDist = useMemo(() => {
    const counts = {}
    machines.forEach((m) => {
      counts[m.failure_type] = (counts[m.failure_type] || 0) + 1
    })
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
  }, [machines])

  const rulByMachine = useMemo(
    () =>
      [...machines]
        .sort((a, b) => a.rul_hours - b.rul_hours)
        .slice(0, 8)
        .map((m) => ({ id: m.id, rul: Number(m.rul_hours.toFixed(0)) })),
    [machines]
  )

  const repairCostByType = useMemo(() => {
    const byType = {}
    machines.forEach((m) => {
      byType[m.machine_type] = (byType[m.machine_type] || 0) + m.estimated_repair_cost
    })
    return Object.entries(byType).map(([type, cost]) => ({ type, cost }))
  }, [machines])

  const maintenanceTrend = useMemo(() => {
    // Aggregate a simple monthly maintenance cost trend across the fleet
    const months = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug']
    return months.map((m, i) => ({
      month: m,
      cost: Math.round(machines.reduce((s, mm) => s + mm.maintenance_cost_total, 0) * (0.08 + i * 0.02) / 6),
      events: 6 + i * 2 + (i % 2),
    }))
  }, [machines])

  return (
    <Layout title="Analytics" subtitle="Fleet-wide trends across health, risk, cost and maintenance">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card title="Average Health Score by Type" subtitle="Higher is better">
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={healthByType} margin={{ left: -18, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eceff2" vertical={false} />
                <XAxis dataKey="type" tick={{ fontSize: 11, fill: '#8993a1' }} axisLine={{ stroke: '#e3e6eb' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#8993a1' }} axisLine={false} tickLine={false} width={30} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #e3e6eb' }} />
                <Bar dataKey="avgHealth" fill="#2c4f74" radius={[3, 3, 0, 0]} maxBarSize={38} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Predicted Failure Types" subtitle="Distribution across the fleet">
          <div className="flex items-center gap-6">
            <div className="h-52 w-52 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={failureTypeDist} dataKey="value" nameKey="name" innerRadius={44} outerRadius={70} paddingAngle={2}>
                    {failureTypeDist.map((entry, i) => (
                      <Cell key={entry.name} fill={FAILURE_COLORS[i % FAILURE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #e3e6eb' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="space-y-2">
              {failureTypeDist.map((d, i) => (
                <li key={d.name} className="flex items-center gap-2 text-[12.5px]">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ backgroundColor: FAILURE_COLORS[i % FAILURE_COLORS.length] }} />
                  <span className="text-[var(--text-secondary)]">{d.name}</span>
                  <span className="ml-auto font-semibold tabular-nums text-[var(--text-primary)]">{d.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        <Card title="Lowest Remaining Useful Life" subtitle="Hours remaining, ascending">
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={rulByMachine} layout="vertical" margin={{ left: 8, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eceff2" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#8993a1' }} axisLine={{ stroke: '#e3e6eb' }} tickLine={false} />
                <YAxis dataKey="id" type="category" tick={{ fontSize: 11, fill: '#8993a1' }} axisLine={false} tickLine={false} width={70} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #e3e6eb' }} />
                <Bar dataKey="rul" fill="#c9670c" radius={[0, 3, 3, 0]} maxBarSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Estimated Repair Cost by Type" subtitle="Aggregated across the fleet">
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={repairCostByType} margin={{ left: 0, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eceff2" vertical={false} />
                <XAxis dataKey="type" tick={{ fontSize: 11, fill: '#8993a1' }} axisLine={{ stroke: '#e3e6eb' }} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#8993a1' }}
                  axisLine={false}
                  tickLine={false}
                  width={54}
                  tickFormatter={(v) => `₹${Math.round(v / 1000)}k`}
                />
                <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #e3e6eb' }} />
                <Bar dataKey="cost" fill="#1c3249" radius={[3, 3, 0, 0]} maxBarSize={38} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Sensor Trend" subtitle="Vibration and temperature — highest-risk asset">
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sensorTrend} margin={{ left: -12, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eceff2" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#8993a1' }} axisLine={{ stroke: '#e3e6eb' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#8993a1' }} axisLine={false} tickLine={false} width={32} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #e3e6eb' }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="vibration" stroke="#c9670c" strokeWidth={2} dot={false} name="Vibration RMS" />
                <Line type="monotone" dataKey="temperature" stroke="#2c4f74" strokeWidth={2} dot={false} name="Motor Temp (°C)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Maintenance Trend" subtitle="Fleet-wide monthly cost and event count">
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={maintenanceTrend} margin={{ left: 0, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eceff2" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#8993a1' }} axisLine={{ stroke: '#e3e6eb' }} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#8993a1' }}
                  axisLine={false}
                  tickLine={false}
                  width={54}
                  tickFormatter={(v) => `₹${Math.round(v / 1000)}k`}
                />
                <Tooltip formatter={(v) => formatCurrency(v)} contentStyle={{ fontSize: 12, borderRadius: 6, border: '1px solid #e3e6eb' }} />
                <Bar dataKey="cost" fill="#5c86ac" radius={[3, 3, 0, 0]} maxBarSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </Layout>
  )
}
