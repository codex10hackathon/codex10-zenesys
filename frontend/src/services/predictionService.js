import { MACHINES, findMachine } from '../data/machines'

function delay(ms = 900) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function mulberry32(seed) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const FAILURE_TYPES = {
  CNC: ['Bearing Failure', 'Spindle Wear', 'Tool Overheat', 'Servo Drift'],
  Pump: ['Seal Leakage', 'Cavitation', 'Impeller Wear', 'Bearing Failure'],
  Compressor: ['Valve Failure', 'Overheat Shutdown', 'Oil Contamination', 'Bearing Failure'],
  'Robotic Arm': ['Joint Wear', 'Actuator Fault', 'Encoder Drift', 'Gripper Failure'],
  Motor: ['Winding Insulation Fault', 'Bearing Failure', 'Rotor Imbalance', 'Overheat'],
  Conveyor: ['Belt Slippage', 'Roller Bearing Wear', 'Motor Overload', 'Misalignment'],
}

const SENSOR_RANGES = {
  CNC: { vibration: [1.2, 4.5], temp: [55, 92], current: [3.5, 8.2], pressure: [15, 32], rpm: [800, 2600] },
  Pump: { vibration: [0.8, 3.8], temp: [45, 85], current: [4.0, 12.5], pressure: [20, 60], rpm: [1200, 3600] },
  Compressor: { vibration: [1.5, 5.2], temp: [60, 105], current: [8.0, 22.0], pressure: [80, 180], rpm: [1500, 3000] },
  'Robotic Arm': { vibration: [0.4, 2.2], temp: [35, 68], current: [1.2, 4.8], pressure: [0, 0], rpm: [0, 0] },
  Motor: { vibration: [1.0, 3.6], temp: [50, 95], current: [5.0, 18.0], pressure: [0, 0], rpm: [900, 3200] },
  Conveyor: { vibration: [0.6, 2.8], temp: [30, 60], current: [2.0, 9.0], pressure: [0, 0], rpm: [40, 180] },
}

const REPAIR_BASE = { CNC: 55000, Pump: 22000, Compressor: 48000, 'Robotic Arm': 65000, Motor: 30000, Conveyor: 18000 }

/**
 * Mocks: POST /api/analyze-machine
 * Request:  { machine_type, machine_id, previous_maintenance_date }
 * Response: full ML prediction payload (see backend contract in docs)
 *
 * In production this call hits the AssetIQ prediction service, which reads
 * live sensor telemetry for the asset and runs it through the RUL / failure
 * classification models. Here it is simulated deterministically from inputs.
 */
export async function analyzeMachine({
  machine_type,
  machine_id,
  previous_maintenance_date,
  vibration_rms,
  temperature_motor,
  current_phase_avg,
  pressure_level,
  rpm,
  operating_mode,
  ambient_temp,
}) {
  await delay(1100)

  // If this machine already exists in the mock fleet, blend its live profile
  // in so navigating to a known ID stays consistent across the app.
  const existing = findMachine(machine_id)

  const seed = Array.from(machine_id).reduce((s, c) => s + c.charCodeAt(0), 0) + new Date(previous_maintenance_date).getTime() / 86400000
  const rand = mulberry32(Math.floor(seed))
  const sr = SENSOR_RANGES[machine_type] || SENSOR_RANGES.CNC

  const lastMaint = new Date(previous_maintenance_date)
  const now = new Date('2026-08-22T10:42:00')
  const hoursSinceMaintenance = Number(Math.max(0, (now - lastMaint) / 36e5).toFixed(1))

  const rangeVal = (min, max, decimals = 1) => Number((min + rand() * (max - min)).toFixed(decimals))

  const failure_probability = existing
    ? existing.failure_probability
    : Number(Math.min(96, Math.max(3, rangeVal(4, 38) + hoursSinceMaintenance / 14)).toFixed(1))

  const risk_level =
    failure_probability >= 70 ? 'CRITICAL' : failure_probability >= 45 ? 'HIGH' : failure_probability >= 20 ? 'MODERATE' : 'LOW'

  const rul_hours = existing
    ? existing.rul_hours
    : Number(Math.max(4, 700 - hoursSinceMaintenance * 1.5 - failure_probability * 4 + rangeVal(-15, 15)).toFixed(1))

  const health_score = existing ? existing.health_score : Number(Math.max(5, Math.min(99, 100 - failure_probability * 0.9)).toFixed(0))

  const failure_type = existing ? existing.failure_type : (FAILURE_TYPES[machine_type] || FAILURE_TYPES.CNC)[Math.floor(rand() * 4)]

  const estimated_repair_cost = existing
    ? existing.estimated_repair_cost
    : Math.round(((REPAIR_BASE[machine_type] || 30000) * (0.6 + failure_probability / 100)) / 500) * 500

  const nextMaintDate = new Date(lastMaint)
  nextMaintDate.setDate(nextMaintDate.getDate() + 30)

  const recommendation =
    risk_level === 'CRITICAL'
      ? 'IMMEDIATE SHUTDOWN & INSPECTION'
      : risk_level === 'HIGH'
      ? 'SCHEDULE MAINTENANCE'
      : risk_level === 'MODERATE'
      ? 'MONITOR CLOSELY'
      : 'CONTINUE NORMAL OPERATION'

  return {
    timestamp: now.toISOString(),
    machine_id,
    machine_type,
    vibration_rms: vibration_rms ?? (existing ? existing.vibration_rms : rangeVal(sr.vibration[0], sr.vibration[1], 2)),
    temperature_motor: temperature_motor ?? (existing ? existing.temperature_motor : rangeVal(sr.temp[0], sr.temp[1], 1)),
    current_phase_avg: current_phase_avg ?? (existing ? existing.current_phase_avg : rangeVal(sr.current[0], sr.current[1], 2)),
    pressure_level: pressure_level ?? (sr.pressure[1] > 0 ? (existing ? existing.pressure_level : rangeVal(sr.pressure[0], sr.pressure[1], 1)) : null),
    rpm: rpm ?? (sr.rpm[1] > 0 ? (existing ? existing.rpm : Math.round(rangeVal(sr.rpm[0], sr.rpm[1], 0))) : null),
    operating_mode: operating_mode || (existing ? existing.operating_mode : 'RUNNING'),
    hours_since_maintenance: hoursSinceMaintenance,
    ambient_temp: ambient_temp ?? (existing ? existing.ambient_temp : rangeVal(22, 34, 1)),
    rul_hours,
    failure_probability,
    failure_within_24h: failure_probability > 65,
    failure_type,
    estimated_repair_cost,
    health_score,
    risk_level,
    recommendation,
    previous_maintenance_date,
    next_maintenance_date: nextMaintDate.toISOString().slice(0, 10),
    maintenance_interval_days: 30,
    status: risk_level === 'CRITICAL' ? 'CRITICAL' : risk_level === 'HIGH' ? 'AT_RISK' : risk_level === 'MODERATE' ? 'WATCH' : 'HEALTHY',
  }
}

export async function getHighRiskMachines(limit = 6) {
  await delay(150)
  return [...MACHINES].sort((a, b) => b.failure_probability - a.failure_probability).slice(0, limit)
}
