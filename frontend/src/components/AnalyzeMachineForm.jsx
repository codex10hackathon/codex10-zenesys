import React, { useState } from 'react'
import { Loader2, ScanSearch } from 'lucide-react'
import { analyzeMachine } from '../services/predictionService'

const MACHINE_TYPES = ['CNC', 'Pump', 'Compressor', 'Robotic Arm', 'Motor', 'Conveyor']

export default function AnalyzeMachineForm({ onAnalyzed }) {
  const [machineType, setMachineType] = useState('')
  const [machineId, setMachineId] = useState('')
  const [prevMaintDate, setPrevMaintDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const canSubmit = machineType && machineId.trim() && prevMaintDate && !loading

  async function handleSubmit(e) {
    e.preventDefault()
    if (!canSubmit) return
    setLoading(true)
    setError('')
    try {
      const result = await analyzeMachine({
        machine_type: machineType,
        machine_id: machineId.trim(),
        previous_maintenance_date: prevMaintDate,
      })
      onAnalyzed?.(result)
    } catch (err) {
      setError('Analysis failed. Please check the inputs and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-4 md:items-end">
      <div className="md:col-span-1">
        <label className="mb-1.5 block text-[12.5px] font-medium text-[var(--text-secondary)]">Machine Type</label>
        <select
          value={machineType}
          onChange={(e) => setMachineType(e.target.value)}
          className="w-full rounded border border-[var(--border-strong)] bg-white px-3 py-2 text-[13.5px] text-[var(--text-primary)] focus-ring"
        >
          <option value="">Select type</option>
          {MACHINE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div className="md:col-span-1">
        <label className="mb-1.5 block text-[12.5px] font-medium text-[var(--text-secondary)]">Machine ID</label>
        <input
          type="text"
          value={machineId}
          onChange={(e) => setMachineId(e.target.value)}
          placeholder="e.g. CNC-2334"
          className="w-full rounded border border-[var(--border-strong)] bg-white px-3 py-2 text-[13.5px] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus-ring"
        />
      </div>

      <div className="md:col-span-1">
        <label className="mb-1.5 block text-[12.5px] font-medium text-[var(--text-secondary)]">Previous Maintenance Date</label>
        <input
          type="date"
          value={prevMaintDate}
          max="2026-08-22"
          onChange={(e) => setPrevMaintDate(e.target.value)}
          className="w-full rounded border border-[var(--border-strong)] bg-white px-3 py-2 text-[13.5px] text-[var(--text-primary)] focus-ring"
        />
      </div>

      <div className="md:col-span-1">
        <button
          type="submit"
          disabled={!canSubmit}
          className="flex w-full items-center justify-center gap-2 rounded bg-navy-700 px-4 py-2 text-[13.5px] font-semibold text-white transition-colors hover:bg-navy-800 disabled:cursor-not-allowed disabled:bg-navy-300 focus-ring"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <ScanSearch size={16} />}
          {loading ? 'Analyzing…' : 'Analyze Machine'}
        </button>
      </div>

      {error && <p className="md:col-span-4 text-[12.5px] text-status-critical">{error}</p>}
    </form>
  )
}
