import { MACHINES, findMachine, getUpcomingMaintenance } from '../data/machines'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

export const SUGGESTED_QUESTIONS = [
  'Why is this machine high risk?',
  'When should I maintain it?',
  'Should I repair or replace it?',
  'What is the repair cost?',
  'What is the estimated resale value?',
  'Should we sell next year?',
]

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload.error || `Request failed with status ${response.status}`)
  }
  return payload
}

function delay(ms = 200) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function normalizeMachine(machine) {
  if (!machine.condition) return machine

  return {
    ...machine.machine,
    ...machine.condition,
    ...machine.maintenance,
    ...machine.prediction,
    ...machine.financial,
    ...machine.asset,
    id: String(machine.machine.id),
    timestamp: machine.machine.last_reading,
    temperature_motor: machine.condition.motor_temperature,
    ambient_temp: machine.condition.ambient_temperature,
    hours_since_maintenance: machine.maintenance.hours_since_last_maintenance,
    failure_probability: machine.prediction?.failure_risk_percentage,
    rul_hours: machine.prediction?.remaining_useful_life,
    health_score: machine.prediction?.health_score,
  }
}

export async function getMachines() {
  const machines = await apiRequest('/machines')
  return machines.map((machine) => ({
    ...machine,
    id: String(machine.id),
    failure_probability: machine.failure_risk_percentage ?? (machine.failure_risk != null ? machine.failure_risk * 100 : null),
    rul_hours: machine.remaining_useful_life,
  }))
}

export async function addMachine(machineInput) {
  const payload = { ...machineInput, name: machineInput.name || machineInput.machine_id }
  return apiRequest('/machines', { method: 'POST', body: JSON.stringify(payload) })
}

export async function getMachineById(machineId) {
  return normalizeMachine(await apiRequest(`/machines/${encodeURIComponent(machineId)}`))
}

export async function getMaintenancePrediction(machineId) {
  const machine = await getMachineById(machineId)
  return {
    machine_id: machine.id,
    last_maintenance_date: machine.previous_maintenance_date,
    next_maintenance_date: machine.next_maintenance_date,
    maintenance_required: ['HIGH', 'CRITICAL'].includes(machine.risk_level),
    maintenance_overdue: false,
    recommendation: machine.recommendation,
  }
}

export async function getMachineSummary() {
  const machines = await getMachines()
  const total = machines.length
  const healthy = machines.filter((m) => m.status === 'HEALTHY').length
  const atRisk = machines.filter((m) => m.status === 'AT_RISK').length
  const critical = machines.filter((m) => m.status === 'CRITICAL').length
  const avgRul = total ? machines.reduce((sum, m) => sum + (m.rul_hours || 0), 0) / total : 0
  const avgRisk = total ? machines.reduce((sum, m) => sum + (m.failure_probability || 0), 0) / total : 0

  return {
    total,
    healthy,
    atRisk,
    critical,
    maintenanceDue: 0,
    avgRul: Number(avgRul.toFixed(1)),
    avgRisk: Number(avgRisk.toFixed(1)),
    totalRepairCost: 0,
  }
}

export async function analyzeMachine({ machine_type, machine_id, previous_maintenance_date, vibration_rms, temperature_motor, current_phase_avg, pressure_level, rpm, operating_mode, ambient_temp }) {
  const response = await apiRequest('/machines', {
    method: 'POST',
    body: JSON.stringify({
      name: machine_id,
      machine_id,
      machine_type,
      previous_maintenance_date,
      vibration_rms,
      motor_temperature: temperature_motor,
      current_phase_avg,
      pressure_level,
      rpm,
      operating_mode,
      ambient_temperature: ambient_temp,
    }),
  })

  const backendPrediction = response.prediction || response

  return {
    machine_id: machine_id || String(response.machine_id),
    machine_type,
    ...backendPrediction,
    failure_risk: backendPrediction.failure_risk,
    failure_risk_percentage: backendPrediction.failure_risk_percentage,
    remaining_useful_life: backendPrediction.remaining_useful_life,
    risk_score: backendPrediction.risk_score,
    risk_level: backendPrediction.risk_level,
    recommendation: backendPrediction.recommendation,
    replacement_flag: backendPrediction.replacement_flag,
    reason: backendPrediction.reason,
    vibration_rms,
    temperature_motor,
    current_phase_avg,
    pressure_level,
    rpm,
    operating_mode,
    ambient_temp,
    previous_maintenance_date,
    backend_machine_id: response.machine_id,
  }
}

export async function getHighRiskMachines(limit = 6) {
  const machines = await apiRequest('/machines')
  return machines
    .sort((a, b) => (b.failure_risk || 0) - (a.failure_risk || 0))
    .slice(0, limit)
    .map((machine) => ({
      ...machine,
      id: String(machine.id),
      failure_probability: machine.failure_risk != null ? machine.failure_risk * 100 : null,
      rul_hours: machine.remaining_useful_life,
    }))
}

export async function askCopilot(machineId, question) {
  const response = await apiRequest(`/machines/${encodeURIComponent(machineId)}/assistant`, {
    method: 'POST',
    body: JSON.stringify({ question }),
  })
  return response.answer
}

export async function getUpcoming() {
  await delay()
  return getUpcomingMaintenance()
}

const LIFECYCLE_STAGES = ['Purchase', 'Deployment', 'Operation', 'Maintenance', 'Repair', 'Upgrade', 'Sell / Retire']

export async function getLifecycle(machineId) {
  await delay(250)
  const machine = findMachine(machineId)
  if (!machine) throw new Error('Machine not found')
  const currentStage = machine.risk_level === 'CRITICAL' ? 'Repair' : machine.age_years >= 7 ? 'Sell / Retire' : machine.risk_level === 'HIGH' ? 'Maintenance' : machine.age_years >= 4 ? 'Upgrade' : 'Operation'
  return {
    machine_id: machineId,
    stages: LIFECYCLE_STAGES,
    current_stage: currentStage,
    current_index: LIFECYCLE_STAGES.indexOf(currentStage),
    machine_age_years: machine.age_years,
    operating_hours: machine.operating_hours_total,
    failures: machine.failure_count,
    maintenance_cost: machine.maintenance_cost_total,
    repair_cost: machine.estimated_repair_cost,
    rul_hours: machine.rul_hours,
    risk_level: machine.risk_level,
    health_score: machine.health_score,
    recommendation: 'Continue monitoring the asset and follow the recommended lifecycle stage.',
  }
}

export async function getResaleValuation(machineId) {
  await delay(300)
  const machine = findMachine(machineId)
  if (!machine) throw new Error('Machine not found')
  const replacementCost = { CNC: 1450000, Pump: 420000, Compressor: 980000, 'Robotic Arm': 1750000, Motor: 560000, Conveyor: 380000 }[machine.machine_type] || 500000
  const currentValue = Math.round((replacementCost * Math.max(0.12, 1 - machine.age_years * 0.11) * (machine.health_score / 100)) / 500) * 500
  return {
    machine_id: machineId,
    current_value: currentValue,
    projection: [0, 1, 2, 3].map((year) => ({ year: year === 0 ? 'Current' : `+${year}Y`, value: Math.round((currentValue * Math.pow(0.82, year)) / 500) * 500 })),
    factors: [],
    sell_recommendation: 'Asset retains healthy resale value. No immediate action required.',
    disclaimer: 'Estimated Resale Value — model-based approximation, not an actual market price or appraisal.',
  }
}