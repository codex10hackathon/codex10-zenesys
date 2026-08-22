import React, { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, CalendarClock } from 'lucide-react'
import Layout from '../components/Layout'
import Card from '../components/Card'
import { getRecords, getCalendarEvents, computeSchedule } from '../services/maintenanceService'
import { formatCurrency, formatDateDisplay, riskMeta } from '../utils/format'

const TABS = ['Records', 'Schedule']

function MiniCalendar({ events }) {
  const [monthOffset, setMonthOffset] = useState(0)
  const base = new Date(2026, 7, 1) // August 2026
  const viewDate = new Date(base.getFullYear(), base.getMonth() + monthOffset, 1)
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const monthLabel = viewDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  const eventsByDay = {}
  events.forEach((e) => {
    const d = new Date(e.date)
    if (d.getFullYear() === year && d.getMonth() === month) {
      eventsByDay[d.getDate()] = eventsByDay[d.getDate()] || []
      eventsByDay[d.getDate()].push(e)
    }
  })

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={() => setMonthOffset((v) => v - 1)}
          className="flex h-7 w-7 items-center justify-center rounded border border-[var(--border-subtle)] hover:bg-[var(--bg-app)] focus-ring"
        >
          <ChevronLeft size={15} />
        </button>
        <p className="text-[13.5px] font-semibold text-[var(--text-primary)]">{monthLabel}</p>
        <button
          onClick={() => setMonthOffset((v) => v + 1)}
          className="flex h-7 w-7 items-center justify-center rounded border border-[var(--border-subtle)] hover:bg-[var(--bg-app)] focus-ring"
        >
          <ChevronRight size={15} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          const dayEvents = day ? eventsByDay[day] || [] : []
          const worst = dayEvents.sort((a, b) => (a.overdue ? -1 : 1))[0]
          return (
            <div
              key={i}
              className={`flex h-16 flex-col rounded border px-1.5 py-1 text-left text-[11.5px] ${
                day ? 'border-[var(--border-subtle)] bg-white' : 'border-transparent'
              }`}
            >
              {day && <span className="text-[var(--text-muted)]">{day}</span>}
              {dayEvents.slice(0, 2).map((e) => (
                <span
                  key={e.machine_id}
                  className="mt-0.5 truncate rounded-sm px-1 py-0.5 text-[10px] font-medium"
                  style={{
                    color: e.overdue ? '#c02929' : riskMeta(e.risk_level).color,
                    backgroundColor: e.overdue ? '#fceaea' : riskMeta(e.risk_level).bg,
                  }}
                  title={`${e.machine_id} — ${e.date}`}
                >
                  {e.machine_id}
                </span>
              ))}
              {dayEvents.length > 2 && <span className="text-[10px] text-[var(--text-muted)]">+{dayEvents.length - 2} more</span>}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Maintenance() {
  const [tab, setTab] = useState('Records')
  const [records, setRecords] = useState([])
  const [events, setEvents] = useState([])
  const [previewDate, setPreviewDate] = useState('2026-08-18')
  const [schedulePreview, setSchedulePreview] = useState(null)

  useEffect(() => {
    getRecords().then(setRecords)
    getCalendarEvents().then(setEvents)
  }, [])

  useEffect(() => {
    if (previewDate) {
      computeSchedule(previewDate).then(setSchedulePreview)
    }
  }, [previewDate])

  return (
    <Layout title="Maintenance" subtitle="Service records and the integrated maintenance schedule">
      <div className="mb-5 flex gap-1 border-b border-[var(--border-subtle)]">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-[13.5px] font-medium transition-colors focus-ring ${
              tab === t ? 'border-b-2 border-navy-700 text-navy-700' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Records' && (
        <Card title="Maintenance Records" subtitle={`${records.length} logged records across the fleet`} noPadding>
          <div className="max-h-[560px] overflow-y-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-[var(--border-subtle)] text-[11.5px] uppercase tracking-wide text-[var(--text-muted)]">
                  <th className="px-5 py-2.5 font-medium">Machine</th>
                  <th className="px-5 py-2.5 font-medium">Date</th>
                  <th className="px-5 py-2.5 font-medium">Type</th>
                  <th className="px-5 py-2.5 font-medium">Description</th>
                  <th className="px-5 py-2.5 font-medium">Performed By</th>
                  <th className="px-5 py-2.5 font-medium">Cost</th>
                  <th className="px-5 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {records.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-5 py-10 text-center text-[13px] text-[var(--text-muted)]">
                      No maintenance records available.
                    </td>
                  </tr>
                ) : (
                  records.map((r) => (
                    <tr key={r.id} className="border-b border-[var(--border-subtle)] last:border-0 hover:bg-[var(--bg-app)]">
                      <td className="px-5 py-2.5 font-medium text-[var(--text-primary)]">{r.machine_id}</td>
                      <td className="px-5 py-2.5 text-[var(--text-secondary)]">{formatDateDisplay(r.date)}</td>
                      <td className="px-5 py-2.5 text-[var(--text-secondary)]">{r.type}</td>
                      <td className="px-5 py-2.5 text-[var(--text-secondary)]">{r.description}</td>
                      <td className="px-5 py-2.5 text-[var(--text-secondary)]">{r.performed_by}</td>
                      <td className="px-5 py-2.5 tabular-nums text-[var(--text-secondary)]">{formatCurrency(r.cost)}</td>
                      <td className="px-5 py-2.5">
                        <span className="inline-flex items-center rounded-sm bg-[#e9f6ee] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-status-healthy">
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === 'Schedule' && (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <Card title="Maintenance Calendar" subtitle="Upcoming and overdue service windows" className="xl:col-span-2">
            <MiniCalendar events={events} />
          </Card>

          <Card title="Schedule Calculator" subtitle="Backend computes the next maintenance window">
            <label className="mb-1.5 block text-[12.5px] font-medium text-[var(--text-secondary)]">Previous Maintenance Date</label>
            <input
              type="date"
              value={previewDate}
              max="2026-08-22"
              onChange={(e) => setPreviewDate(e.target.value)}
              className="mb-4 w-full rounded border border-[var(--border-strong)] px-3 py-2 text-[13.5px] focus-ring"
            />
            {schedulePreview && (
              <div className="space-y-2.5 rounded border border-[var(--border-subtle)] bg-[var(--bg-app)] p-4">
                <div className="flex items-center gap-2 text-navy-700">
                  <CalendarClock size={15} />
                  <span className="text-[12.5px] font-semibold uppercase tracking-wide">Backend Result</span>
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-[var(--text-secondary)]">Recommended Interval</span>
                  <span className="font-semibold text-[var(--text-primary)]">{schedulePreview.recommended_interval_days} days</span>
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-[var(--text-secondary)]">Next Maintenance Date</span>
                  <span className="font-semibold text-[var(--text-primary)]">
                    {formatDateDisplay(schedulePreview.next_maintenance_date)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-[var(--text-secondary)]">Maintenance Status</span>
                  <span
                    className={`font-semibold ${
                      schedulePreview.maintenance_status === 'OVERDUE' ? 'text-status-critical' : 'text-status-healthy'
                    }`}
                  >
                    {schedulePreview.maintenance_status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </Layout>
  )
}
