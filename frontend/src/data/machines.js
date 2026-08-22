// Deterministic mock dataset for AssetIQ.
// Simulates what a backend/ML asset-monitoring service would return.

const MACHINE_TYPES = ['CNC', 'Pump', 'Compressor', 'Robotic Arm', 'Motor', 'Conveyor']

const FAILURE_TYPES = {
  CNC: ['Bearing Failure', 'Spindle Wear', 'Tool Overheat', 'Servo Drift'],
  Pump: ['Seal Leakage', 'Cavitation', 'Impeller Wear', 'Bearing Failure'],
  Compressor: ['Valve Failure', 'Overheat Shutdown', 'Oil Contamination', 'Bearing Failure'],
  'Robotic Arm': ['Joint Wear', 'Actuator Fault', 'Encoder Drift', 'Gripper Failure'],
  Motor: ['Winding Insulation Fault', 'Bearing Failure', 'Rotor Imbalance', 'Overheat'],
  Conveyor: ['Belt Slippage', 'Roller Bearing Wear', 'Motor Overload', 'Misalignment'],
}

const LOCATIONS = ['Plant A - Bay 1', 'Plant A - Bay 2', 'Plant B - Line 3', 'Plant B - Line 4', 'Plant C - Assembly']

// Simple seeded PRNG so the dataset is stable across reloads.
function mulberry32(seed) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const rand = mulberry32(42)

function pick(arr) {
  return arr[Math.floor(rand() * arr.length)]
}

function range(min, max, decimals = 1) {
  const v = min + rand() * (max - min)
  return Number(v.toFixed(decimals))
}

function daysAgo(n) {
  const d = new Date('2026-08-22T10:42:00')
  d.setDate(d.getDate() - n)
  return d
}

function formatDate(d) {
  return d.toISOString().slice(0, 10)
}

function riskLevelFromProbability(p) {
  if (p >= 70) return 'CRITICAL'
  if (p >= 45) return 'HIGH'
  if (p >= 20) return 'MODERATE'
  return 'LOW'
}

function statusFromRisk(riskLevel) {
  if (riskLevel === 'CRITICAL') return 'CRITICAL'
  if (riskLevel === 'HIGH') return 'AT_RISK'
  if (riskLevel === 'MODERATE') return 'WATCH'
  return 'HEALTHY'
}

function buildMachine(index) {
  const type = MACHINE_TYPES[index % MACHINE_TYPES.length]
  const prefixMap = { CNC: 'CNC', Pump: 'PMP', Compressor: 'CMP', 'Robotic Arm': 'ARM', Motor: 'MTR', Conveyor: 'CNV' }
  const id = `${prefixMap[type]}-${2100 + index}`
  const ageYears = range(0.5, 9, 1)
  const purchaseDate = new Date('2026-08-22')
  purchaseDate.setFullYear(purchaseDate.getFullYear() - Math.ceil(ageYears))

  const lastMaintDaysAgo = Math.floor(range(2, 60, 0))
  const lastMaintDate = daysAgo(lastMaintDaysAgo)
  const hoursSinceMaintenance = Number((lastMaintDaysAgo * range(6, 16, 1)).toFixed(1))

  const failureProbability = Number(
    Math.min(96, Math.max(2, range(2, 45) + hoursSinceMaintenance / 12 + (rand() > 0.8 ? range(10, 40) : 0))).toFixed(1)
  )
  const riskLevel = riskLevelFromProbability(failureProbability)
  const status = statusFromRisk(riskLevel)

  const rul = Number(Math.max(4, 620 - hoursSinceMaintenance * 1.6 - failureProbability * 4 + range(-20, 20)).toFixed(1))
  const healthScore = Number(Math.max(4, Math.min(99, 100 - failureProbability * 0.9 - range(0, 8))).toFixed(0))

  const failureType = pick(FAILURE_TYPES[type])
  const repairCostBase = { CNC: 55000, Pump: 22000, Compressor: 48000, 'Robotic Arm': 65000, Motor: 30000, Conveyor: 18000 }[type]
  const estimatedRepairCost = Math.round((repairCostBase * (0.6 + failureProbability / 100)) / 500) * 500

  const nextMaintInterval = 30
  const nextMaintDate = new Date(lastMaintDate)
  nextMaintDate.setDate(nextMaintDate.getDate() + nextMaintInterval)
  const maintenanceOverdue = nextMaintDate < new Date('2026-08-22')

  const recommendation =
    riskLevel === 'CRITICAL'
      ? 'IMMEDIATE SHUTDOWN & INSPECTION'
      : riskLevel === 'HIGH'
      ? 'SCHEDULE MAINTENANCE'
      : riskLevel === 'MODERATE'
      ? 'MONITOR CLOSELY'
      : 'CONTINUE NORMAL OPERATION'

  const sensorRanges = {
    CNC: { vibration: [1.2, 4.5], temp: [55, 92], current: [3.5, 8.2], pressure: [15, 32], rpm: [800, 2600] },
    Pump: { vibration: [0.8, 3.8], temp: [45, 85], current: [4.0, 12.5], pressure: [20, 60], rpm: [1200, 3600] },
    Compressor: { vibration: [1.5, 5.2], temp: [60, 105], current: [8.0, 22.0], pressure: [80, 180], rpm: [1500, 3000] },
    'Robotic Arm': { vibration: [0.4, 2.2], temp: [35, 68], current: [1.2, 4.8], pressure: [0, 0], rpm: [0, 0] },
    Motor: { vibration: [1.0, 3.6], temp: [50, 95], current: [5.0, 18.0], pressure: [0, 0], rpm: [900, 3200] },
    Conveyor: { vibration: [0.6, 2.8], temp: [30, 60], current: [2.0, 9.0], pressure: [0, 0], rpm: [40, 180] },
  }
  const sr = sensorRanges[type]

  return {
    id,
    machine_type: type,
    location: pick(LOCATIONS),
    purchase_date: formatDate(purchaseDate),
    age_years: ageYears,
    status,
    risk_level: riskLevel,
    timestamp: '2026-08-22T10:42:00',
    vibration_rms: range(sr.vibration[0], sr.vibration[1], 2),
    temperature_motor: range(sr.temp[0], sr.temp[1], 1),
    current_phase_avg: range(sr.current[0], sr.current[1], 2),
    pressure_level: sr.pressure[1] > 0 ? range(sr.pressure[0], sr.pressure[1], 1) : null,
    rpm: sr.rpm[1] > 0 ? Math.round(range(sr.rpm[0], sr.rpm[1], 0)) : null,
    operating_mode: pick(['RUNNING', 'RUNNING', 'RUNNING', 'IDLE', 'STANDBY']),
    ambient_temp: range(22, 34, 1),
    previous_maintenance_date: formatDate(lastMaintDate),
    hours_since_maintenance: hoursSinceMaintenance,
    next_maintenance_date: formatDate(nextMaintDate),
    maintenance_interval_days: nextMaintInterval,
    maintenance_overdue: maintenanceOverdue,
    rul_hours: rul,
    failure_probability: failureProbability,
    failure_within_24h: failureProbability > 65,
    failure_type: failureType,
    estimated_repair_cost: estimatedRepairCost,
    health_score: healthScore,
    recommendation,
    operating_hours_total: Math.round(ageYears * 365 * range(4, 14, 0)),
    failure_count: Math.round(range(0, 6, 0)),
    maintenance_cost_total: Math.round(range(20000, 260000, 0)),
  }
}

export const MACHINES = Array.from({ length: 18 }, (_, i) => buildMachine(i))

export function findMachine(id) {
  return MACHINES.find((m) => m.id === id)
}

// Sensor history series for charts (last 14 readings per machine)
export function getSensorHistory(machineId) {
  const machine = findMachine(machineId)
  if (!machine) return []
  const seedRand = mulberry32(machineId.length * 97 + machineId.charCodeAt(0))
  const points = []
  for (let i = 13; i >= 0; i--) {
    const d = daysAgo(i)
    const drift = (13 - i) / 13
    points.push({
      date: formatDate(d).slice(5),
      vibration: Number((machine.vibration_rms * (0.75 + drift * 0.35) + seedRand() * 0.2).toFixed(2)),
      temperature: Number((machine.temperature_motor * (0.85 + drift * 0.2) + seedRand() * 2).toFixed(1)),
      health: Number(Math.max(10, machine.health_score + (1 - drift) * 15 - seedRand() * 5).toFixed(0)),
      failureRisk: Number(Math.max(2, machine.failure_probability * (0.5 + drift * 0.6) + seedRand() * 4).toFixed(1)),
    })
  }
  return points
}

export function getUpcomingMaintenance() {
  return MACHINES.filter((m) => m.maintenance_overdue || m.risk_level === 'HIGH' || m.risk_level === 'CRITICAL')
    .sort((a, b) => new Date(a.next_maintenance_date) - new Date(b.next_maintenance_date))
    .slice(0, 8)
}
