import React, { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import Card from '../components/Card'
import { getRecords } from '../services/api'
import { formatCurrency, formatDateDisplay } from '../utils/format'

export default function Maintenance() {
  const [records, setRecords] = useState([])

  useEffect(() => {
    getRecords().then(setRecords)
  }, [])

  return (
    <Layout title="Maintenance">
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
    </Layout>
  )
}
