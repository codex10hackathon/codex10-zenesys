import React, { useEffect, useState } from 'react'
import { useParams, useLocation, Link } from 'react-router-dom'
import {
  Activity,
  Thermometer,
  Zap,
  Gauge,
  RotateCw,
  Power,
  Wind,
  Wrench,
  Clock,
  CalendarClock,
  AlertTriangle,
  TrendingDown,
  ShieldAlert,
  IndianRupee,
  HeartPulse,
  ArrowLeft,
} from 'lucide-react'
import Layout from '../components/Layout'
import Card from '../components/Card'
import { RiskBadge } from '../components/Badges'
import { useMachineProfile } from '../hooks/useMachineProfile'
import { useMachineContext } from '../context/MachineContext'
import { formatCurrency, formatDateDisplay, formatDateTimeDisplay, formatNumber } from '../utils/format'

function ConditionMetric({ icon: Icon, label, value, unit }) {
  return (
    <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-app)] px-4 py-3">
      <div className="mb-1.5 flex items-center gap-2 text-[var(--text-muted)]">
        <Icon size={14} strokeWidth={2} />
        <span className="text-[11.5px] font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="tabular-nums text-[19px] font-semibold text-[var(--text-primary)]">
        {value} <span className="text-[13px] font-normal text-[var(--text-muted)]">{unit}</span>
      </p>
    </div>
  )
}

function InfoRow({ label, value, valueClass = '' }) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--border-subtle)] py-2.5 last:border-0">
      <span className="text-[13px] text-[var(--text-secondary)]">{label}</span>
      <span className={`text-[13.5px] font-semibold text-[var(--text-primary)] ${valueClass}`}>{value}</span>
    </div>
  )
}

export default function MachineProfile() {
  const { machineId } = useParams()
  const location = useLocation()
  const { machine: fetchedMachine, loading } = useMachineProfile(machineId)
  const { selectMachine } = useMachineContext()

  const passedAnalysis = location.state?.analysis
  const [machine, setMachine] = useState(passedAnalysis || null)

  useEffect(() => {
    if (!passedAnalysis && fetchedMachine) {
      setMachine(fetchedMachine)
    }
  }, [fetchedMachine, passedAnalysis])

  useEffect(() => {
    selectMachine(machineId)
  }, [machineId, selectMachine])

  if (!machine && loading) {
    return (
      <Layout title="Machine Profile">
        <p className="text-[13px] text-[var(--text-muted)]">Loading machine profile…</p>
      </Layout>
    )
  }

  if (!machine) {
    return (
      <Layout title="Machine Profile">
        <p className="text-[13px] text-[var(--text-muted)]">Machine not found.</p>
      </Layout>
    )
  }

  const riskLevel = machine.risk_level
  const isHighRisk = riskLevel === 'HIGH' || riskLevel === 'CRITICAL'

  return (
    <Layout title="Machine Profile" subtitle="Live condition, prediction and financial summary">
      <Link to="/machines" className="mb-4 inline-flex items-center gap-1.5 text-[12.5px] font-medium text-navy-600 hover:underline">
        <ArrowLeft size={14} /> Back to machines
      </Link>

      {/* MACHINE HEADER */}
      <Card className="mb-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-[19px] font-semibold text-[var(--text-primary)]">
                {machine.machine_type} {machine.id}
              </h2>
              <span className="inline-flex items-center gap-1.5 rounded-sm bg-[#e9f6ee] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-status-healthy">
                <span className="h-1.5 w-1.5 rounded-full bg-status-healthy" /> {machine.operating_mode || 'ACTIVE'}
              </span>
            </div>
            <p className="mt-1 text-[12.5px] text-[var(--text-muted)]">
              Last reading: {formatDateTimeDisplay(machine.timestamp)}
            </p>
          </div>
          <RiskBadge risk={riskLevel} />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="space-y-5 xl:col-span-2">
          {/* MACHINE CONDITION */}
          <Card title="Machine Condition" subtitle="Live sensor telemetry">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <ConditionMetric icon={Activity} label="Vibration RMS" value={formatNumber(machine.vibration_rms, 2)} unit="mm/s" />
              <ConditionMetric icon={Thermometer} label="Motor Temperature" value={formatNumber(machine.temperature_motor, 1)} unit="°C" />
              <ConditionMetric icon={Zap} label="Current Phase Avg" value={formatNumber(machine.current_phase_avg, 2)} unit="A" />
              <ConditionMetric
                icon={Gauge}
                label="Pressure Level"
                value={machine.pressure_level != null ? formatNumber(machine.pressure_level, 1) : 'N/A'}
                unit={machine.pressure_level != null ? 'bar' : ''}
              />
              <ConditionMetric
                icon={RotateCw}
                label="RPM"
                value={machine.rpm != null ? Number(machine.rpm).toLocaleString('en-IN') : 'N/A'}
                unit=""
              />
              <ConditionMetric icon={Power} label="Operating Mode" value={machine.operating_mode} unit="" />
              <ConditionMetric icon={Wind} label="Ambient Temperature" value={formatNumber(machine.ambient_temp, 1)} unit="°C" />
            </div>
          </Card>

          {/* MAINTENANCE */}
          <Card title="Maintenance" subtitle="Service history and next window">
            <InfoRow label="Previous Maintenance" value={formatDateDisplay(machine.previous_maintenance_date)} />
            <InfoRow label="Hours Since Last Maintenance" value={`${formatNumber(machine.hours_since_maintenance, 1)} h`} />
            <InfoRow
              label="Next Recommended Maintenance"
              value={formatDateDisplay(machine.next_maintenance_date)}
              valueClass="text-navy-700"
            />
          </Card>

          {/* PREDICTION */}
          <Card title="Prediction" subtitle="Model output from the AssetIQ prediction service">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded border border-[var(--border-subtle)] p-4">
                <div className="mb-1 flex items-center gap-2 text-[var(--text-muted)]">
                  <ShieldAlert size={14} />
                  <span className="text-[11.5px] font-medium uppercase tracking-wide">Failure Risk</span>
                </div>
                <p className="tabular-nums text-[26px] font-semibold text-[var(--text-primary)]">
                  {formatNumber(machine.failure_probability, 1)}%
                </p>
                <div className="mt-2">
                  <RiskBadge risk={riskLevel} />
                </div>
              </div>
              <div className="rounded border border-[var(--border-subtle)] p-4">
                <div className="mb-1 flex items-center gap-2 text-[var(--text-muted)]">
                  <Clock size={14} />
                  <span className="text-[11.5px] font-medium uppercase tracking-wide">Remaining Useful Life</span>
                </div>
                <p className="tabular-nums text-[26px] font-semibold text-[var(--text-primary)]">
                  {formatNumber(machine.rul_hours, 1)} <span className="text-[14px] font-normal text-[var(--text-muted)]">hours</span>
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <InfoRow label="Failure Type" value={machine.failure_type} />
              <InfoRow
                label="Recommendation"
                value={machine.recommendation}
                valueClass={isHighRisk ? 'text-status-risk' : 'text-status-healthy'}
              />
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          {/* FINANCIAL */}
          <Card title="Financial">
            <div className="mb-4 flex items-center gap-2 rounded border border-[var(--border-subtle)] bg-[var(--bg-app)] px-4 py-3.5">
              <IndianRupee size={16} className="text-navy-700" />
              <div>
                <p className="text-[11.5px] uppercase tracking-wide text-[var(--text-muted)]">Estimated Repair Cost</p>
                <p className="tabular-nums text-[20px] font-semibold text-[var(--text-primary)]">
                  {formatCurrency(machine.estimated_repair_cost)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded border border-[var(--border-subtle)] px-4 py-3.5">
              <HeartPulse size={16} className="text-navy-700" />
              <div>
                <p className="text-[11.5px] uppercase tracking-wide text-[var(--text-muted)]">Health Score</p>
                <p className="tabular-nums text-[20px] font-semibold text-[var(--text-primary)]">{machine.health_score}/100</p>
              </div>
            </div>
          </Card>

          <Card title="Next Steps">
            <div className="space-y-2">
              <Link
                to="/maintenance"
                className="flex items-center gap-2.5 rounded border border-[var(--border-subtle)] px-3.5 py-2.5 text-[13px] font-medium text-[var(--text-primary)] hover:bg-[var(--bg-app)]"
              >
                <Wrench size={15} className="text-navy-600" /> Schedule Maintenance
              </Link>
              <Link
                to="/lifecycle"
                className="flex items-center gap-2.5 rounded border border-[var(--border-subtle)] px-3.5 py-2.5 text-[13px] font-medium text-[var(--text-primary)] hover:bg-[var(--bg-app)]"
              >
                <CalendarClock size={15} className="text-navy-600" /> View Lifecycle Stage
              </Link>
              <Link
                to="/resale"
                className="flex items-center gap-2.5 rounded border border-[var(--border-subtle)] px-3.5 py-2.5 text-[13px] font-medium text-[var(--text-primary)] hover:bg-[var(--bg-app)]"
              >
                <TrendingDown size={15} className="text-navy-600" /> Check Resale Value
              </Link>
              <Link
                to="/copilot"
                className="flex items-center gap-2.5 rounded border border-[var(--border-subtle)] px-3.5 py-2.5 text-[13px] font-medium text-[var(--text-primary)] hover:bg-[var(--bg-app)]"
              >
                <AlertTriangle size={15} className="text-navy-600" /> Ask Copilot
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </Layout>
  )
}
