import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, Thermometer, Zap, Gauge, RotateCw, Power, Wind, Wrench, Plus, Loader2 } from 'lucide-react'
import Layout from '../components/Layout'
import Card from '../components/Card'
import { RiskBadge } from '../components/Badges'
import { useMachines } from '../hooks/useMachines'
import { getMaintenancePrediction, analyzeMachine } from '../services/api'
import { formatDateDisplay, formatNumber } from '../utils/format'

function ParameterItem({ icon: Icon, label, value, unit }) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--border-subtle)] py-2.5 last:border-0">
      <div className="flex items-center gap-2">
        <Icon size={14} strokeWidth={2} className="text-[var(--text-muted)]" />
        <span className="text-[12px] text-[var(--text-secondary)]">{label}</span>
      </div>
      <span className="text-[12.5px] font-semibold text-[var(--text-primary)]">
        {value} <span className="text-[11px] font-normal text-[var(--text-muted)]">{unit}</span>
      </span>
    </div>
  )
}

export default function Machines() {
  const { machines, loading } = useMachines()
  const [machineType, setMachineType] = useState('')
  const [machineId, setMachineId] = useState('')
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState('')
  const [maintenancePrediction, setMaintenancePrediction] = useState(null)
  const [maintenanceLoading, setMaintenanceLoading] = useState(false)
  const [showAddMachine, setShowAddMachine] = useState(false)
  const [prediction, setPrediction] = useState(null)
  const [predictionLoading, setPredictionLoading] = useState(false)
  const [predictionError, setPredictionError] = useState('')
  const [newMachine, setNewMachine] = useState({
    machine_type: '',
    machine_id: '',
    vibration_rms: '',
    temperature_motor: '',
    current_phase_avg: '',
    pressure_level: '',
    rpm: '',
    operating_mode: 'RUNNING',
    ambient_temp: '',
    previous_maintenance_date: '',
  })

  const machineTypes = [...new Set(machines.map((m) => m.machine_type))]

  const handleSearch = async (e) => {
    e.preventDefault()
    setError('')
    setSearched(true)
    setMaintenancePrediction(null)

    if (!machineType || !machineId) {
      setError('Please enter both Machine Type and Machine ID')
      return
    }

    // Validate machine exists
    const machine = machines.find(
      (m) => m.machine_type === machineType && m.id === machineId
    )
    if (!machine) {
      setError(`Machine not found: ${machineType} - ${machineId}`)
      return
    }

    setMaintenanceLoading(true)
    try {
      const prediction = await getMaintenancePrediction(machine.id)
      setMaintenancePrediction(prediction)
    } catch (predictionError) {
      setError(predictionError.message)
    } finally {
      setMaintenanceLoading(false)
    }
  }

  const searchedMachine = machines.find(
    (m) => m.machine_type === machineType && m.id === machineId
  )

  const updateNewMachine = (field, value) => {
    setNewMachine((current) => ({ ...current, [field]: value }))
  }

  const handlePrediction = async (e) => {
    e.preventDefault()
    setPredictionError('')
    setPrediction(null)
    setPredictionLoading(true)
    try {
      const machinePayload = {
        ...newMachine,
        machine_id: newMachine.machine_id.trim().toUpperCase(),
        vibration_rms: Number(newMachine.vibration_rms),
        temperature_motor: Number(newMachine.temperature_motor),
        current_phase_avg: Number(newMachine.current_phase_avg),
        pressure_level: newMachine.pressure_level === '' ? null : Number(newMachine.pressure_level),
        rpm: newMachine.rpm === '' ? null : Number(newMachine.rpm),
        ambient_temp: Number(newMachine.ambient_temp),
      }
      const result = await analyzeMachine({
        ...machinePayload,
      })
      setPrediction(result)
    } catch (predictionRequestError) {
      setPredictionError('Prediction failed. Please check the entered values and try again.')
    } finally {
      setPredictionLoading(false)
    }
  }

  return (
    <Layout
      title="Machines"
      actions={
        <button
          type="button"
          onClick={() => setShowAddMachine((current) => !current)}
          className="inline-flex items-center gap-2 rounded bg-navy-700 px-3.5 py-2 text-[12.5px] font-semibold text-white hover:bg-navy-800 focus-ring"
        >
          <Plus size={15} />
          Add Machine
        </button>
      }
    >
      {showAddMachine && (
        <Card title="Add Machine" subtitle="Enter machine parameters and request a backend prediction" className="mb-5">
          <form onSubmit={handlePrediction} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              {[
                ['machine_type', 'Machine Type', 'text', 'e.g., CNC'],
                ['machine_id', 'Machine ID', 'text', 'e.g., CNC-2334'],
                ['previous_maintenance_date', 'Last Maintenance Date', 'date', ''],
                ['vibration_rms', 'Vibration RMS', 'number', 'mm/s'],
                ['temperature_motor', 'Motor Temperature', 'number', '°C'],
                ['current_phase_avg', 'Current Phase Avg', 'number', 'A'],
                ['pressure_level', 'Pressure Level', 'number', 'bar'],
                ['rpm', 'RPM', 'number', ''],
                ['ambient_temp', 'Ambient Temperature', 'number', '°C'],
              ].map(([field, label, type, placeholder]) => (
                <label key={field} className="block text-[12.5px] font-medium text-[var(--text-secondary)]">
                  <span className="mb-1.5 block">{label}</span>
                  <input
                    required={field !== 'pressure_level' && field !== 'rpm'}
                    type={type}
                    step={type === 'number' ? 'any' : undefined}
                    value={newMachine[field]}
                    onChange={(e) => updateNewMachine(field, e.target.value)}
                    placeholder={placeholder}
                    className="w-full rounded border border-[var(--border-strong)] px-3 py-2 text-[13px] outline-none placeholder:text-[var(--text-muted)] focus-ring"
                  />
                </label>
              ))}
              <label className="block text-[12.5px] font-medium text-[var(--text-secondary)]">
                <span className="mb-1.5 block">Operating Mode</span>
                <select
                  value={newMachine.operating_mode}
                  onChange={(e) => updateNewMachine('operating_mode', e.target.value)}
                  className="w-full rounded border border-[var(--border-strong)] bg-white px-3 py-2 text-[13px] outline-none focus-ring"
                >
                  <option>RUNNING</option>
                  <option>IDLE</option>
                  <option>STANDBY</option>
                </select>
              </label>
            </div>
            {predictionError && <p className="text-[12.5px] text-status-critical">{predictionError}</p>}
            <button
              type="submit"
              disabled={predictionLoading}
              className="inline-flex items-center gap-2 rounded bg-navy-700 px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-navy-800 disabled:opacity-50 focus-ring"
            >
              {predictionLoading && <Loader2 size={15} className="animate-spin" />}
              {predictionLoading ? 'Predicting…' : 'Make Prediction'}
            </button>
          </form>
        </Card>
      )}

      {prediction && (
        <Card title="Machine Prediction" subtitle={`${prediction.machine_type} ${prediction.machine_id}`} className="mb-5">
          <div className="grid gap-3 md:grid-cols-3">
            <ParameterItem icon={Activity} label="Vibration RMS" value={formatNumber(prediction.vibration_rms, 2)} unit="mm/s" />
            <ParameterItem icon={Thermometer} label="Motor Temperature" value={formatNumber(prediction.temperature_motor, 1)} unit="°C" />
            <ParameterItem icon={Zap} label="Current Phase Avg" value={formatNumber(prediction.current_phase_avg, 2)} unit="A" />
            <ParameterItem icon={Gauge} label="Pressure Level" value={formatNumber(prediction.pressure_level, 1)} unit="bar" />
            <ParameterItem icon={RotateCw} label="RPM" value={prediction.rpm == null ? 'N/A' : Number(prediction.rpm).toLocaleString('en-IN')} unit="" />
            <ParameterItem icon={Power} label="Operating Mode" value={prediction.operating_mode} unit="" />
            <ParameterItem icon={Wind} label="Ambient Temperature" value={formatNumber(prediction.ambient_temp, 1)} unit="°C" />
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-[var(--border-subtle)] pt-4">
            <RiskBadge risk={prediction.risk_level} />
            <span className="text-[12.5px] font-semibold text-[var(--text-secondary)]">{prediction.recommendation}</span>
          </div>
        </Card>
      )}

      <Card title="Request Machine Details">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-[12px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
                Machine Type
              </label>
              <select
                value={machineType}
                onChange={(e) => setMachineType(e.target.value)}
                className="w-full rounded border border-[var(--border-strong)] bg-white px-3 py-2.5 text-[13px] outline-none"
              >
                <option value="">Select a type…</option>
                {machineTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[12px] font-medium uppercase tracking-wide text-[var(--text-muted)]">
                Machine ID
              </label>
              <input
                type="text"
                value={machineId}
                onChange={(e) => setMachineId(e.target.value.toUpperCase())}
                placeholder="e.g., CNC-2100"
                className="w-full rounded border border-[var(--border-strong)] px-3 py-2.5 text-[13px] outline-none placeholder:text-[var(--text-muted)]"
              />
            </div>
          </div>

          {error && (
            <div className="rounded border border-[#d97777] bg-[#fde6e6] px-3 py-2.5">
              <p className="text-[12.5px] font-medium text-[#c02929]">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-navy-600 px-4 py-2.5 text-[13px] font-semibold text-white hover:bg-navy-700 disabled:opacity-50"
          >
            {loading ? 'Loading…' : 'Get Machine Details'}
          </button>
        </form>
      </Card>

      {searched && searchedMachine && (
        <Card className="mt-5">
          <div className="mb-6 flex items-start justify-between border-b border-[var(--border-subtle)] pb-4">
            <div>
              <h2 className="text-[19px] font-semibold text-[var(--text-primary)]">
                {searchedMachine.machine_type} {searchedMachine.id}
              </h2>
              <p className="mt-1 text-[12px] text-[var(--text-muted)]">{searchedMachine.location}</p>
              <p className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                Last reading: {searchedMachine.timestamp}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <RiskBadge risk={searchedMachine.risk_level} />
              <button
                type="button"
                onClick={() => document.getElementById('maintenance-prediction')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center rounded border border-navy-600 px-3 py-1.5 text-[12px] font-semibold text-navy-600 hover:bg-navy-50"
              >
                Maintenance
              </button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
          <div id="maintenance-prediction" className="order-1">
            <div className="mb-4 flex items-center gap-2">
              <Wrench size={16} className="text-[var(--text-muted)]" />
              <h3 className="text-[14px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                Maintenance Prediction
              </h3>
            </div>

            {maintenanceLoading ? (
              <p className="text-[12.5px] text-[var(--text-muted)]">Fetching maintenance prediction…</p>
            ) : maintenancePrediction ? (
              <div className="space-y-3">
                <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-app)] px-3 py-3">
                  <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">Last Maintenance</p>
                  <p className="mt-1 text-[13px] font-semibold text-[var(--text-primary)]">
                    {formatDateDisplay(maintenancePrediction.last_maintenance_date)}
                  </p>
                </div>
                <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-app)] px-3 py-3">
                  <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">Next Due Date</p>
                  <p className="mt-1 text-[13px] font-semibold text-[var(--text-primary)]">
                    {formatDateDisplay(maintenancePrediction.next_maintenance_date)}
                  </p>
                </div>
                <div
                  className={`rounded border px-3 py-3 ${
                    maintenancePrediction.maintenance_required
                      ? 'border-[#f3bcbc] bg-[#fceaea]'
                      : 'border-[#bfe4cd] bg-[#e9f6ee]'
                  }`}
                >
                  <p className="text-[11px] uppercase tracking-wide text-[var(--text-muted)]">Backend Prediction</p>
                  <p
                    className={`mt-1 text-[13px] font-semibold ${
                      maintenancePrediction.maintenance_required ? 'text-[#c02929]' : 'text-[#1f8a4c]'
                    }`}
                  >
                    {maintenancePrediction.maintenance_required ? 'Maintenance Required' : 'Maintenance Not Required'}
                  </p>
                </div>
                <p className="text-[12px] text-[var(--text-secondary)]">
                  Recommendation: {maintenancePrediction.recommendation}
                </p>
              </div>
            ) : null}
          </div>

          <div className="order-2">
            <h3 className="mb-4 text-[14px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Machine Condition
            </h3>
            <div className="space-y-0">
              <ParameterItem
                icon={Activity}
                label="Vibration RMS"
                value={formatNumber(searchedMachine.vibration_rms, 2)}
                unit="mm/s"
              />
              <ParameterItem
                icon={Thermometer}
                label="Motor Temperature"
                value={formatNumber(searchedMachine.temperature_motor, 1)}
                unit="°C"
              />
              <ParameterItem
                icon={Zap}
                label="Current Phase Avg"
                value={formatNumber(searchedMachine.current_phase_avg, 2)}
                unit="A"
              />
              <ParameterItem
                icon={Gauge}
                label="Pressure Level"
                value={searchedMachine.pressure_level != null ? formatNumber(searchedMachine.pressure_level, 1) : 'N/A'}
                unit={searchedMachine.pressure_level != null ? 'bar' : ''}
              />
              <ParameterItem
                icon={RotateCw}
                label="RPM"
                value={searchedMachine.rpm != null ? Number(searchedMachine.rpm).toLocaleString('en-IN') : 'N/A'}
                unit=""
              />
              <ParameterItem
                icon={Power}
                label="Operating Mode"
                value={searchedMachine.operating_mode}
                unit=""
              />
              <ParameterItem
                icon={Wind}
                label="Ambient Temperature"
                value={formatNumber(searchedMachine.ambient_temp, 1)}
                unit="°C"
              />
            </div>
          </div>

          </div>

          <Link
            to={`/machines/${searchedMachine.id}`}
            className="inline-block rounded border border-[var(--border-subtle)] px-4 py-2 text-[12.5px] font-medium text-navy-600 hover:bg-[var(--bg-app)]"
          >
            View Full Profile →
          </Link>
        </Card>
      )}
    </Layout>
  )
}
