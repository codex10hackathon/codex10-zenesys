import { MACHINES, findMachine } from '../data/machines'

const LATENCY = 220
const machineStore = [...MACHINES]

function delay(ms = LATENCY) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function getMachines() {
  await delay()
  return [...machineStore]
}

export async function addMachine(machineInput) {
  await delay()
  const machine = {
    ...machineInput,
    id: machineInput.machine_id,
    machine_type: machineInput.machine_type,
    previous_maintenance_date: machineInput.previous_maintenance_date,
    timestamp: new Date().toISOString(),
  }
  const existingIndex = machineStore.findIndex((item) => item.id === machine.id)
  if (existingIndex >= 0) {
    machineStore[existingIndex] = { ...machineStore[existingIndex], ...machine }
  } else {
    machineStore.push(machine)
  }
  return machine
}

export async function getMachineById(machineId) {
  await delay(150)
  const machine = findMachine(machineId)
  if (!machine) throw new Error(`Machine ${machineId} not found`)
  return machine
}

export async function getMaintenancePrediction(machineId) {
  await delay(150)
  const machine = findMachine(machineId)
  if (!machine) throw new Error(`Machine ${machineId} not found`)

  return {
    machine_id: machine.id,
    last_maintenance_date: machine.previous_maintenance_date,
    next_maintenance_date: machine.next_maintenance_date,
    maintenance_required: machine.maintenance_overdue || machine.risk_level === 'HIGH' || machine.risk_level === 'CRITICAL',
    maintenance_overdue: machine.maintenance_overdue,
    recommendation: machine.recommendation,
  }
}

export async function getMachineSummary() {
  await delay(150)
  const total = MACHINES.length
  const healthy = MACHINES.filter((m) => m.status === 'HEALTHY').length
  const atRisk = MACHINES.filter((m) => m.status === 'AT_RISK').length
  const critical = MACHINES.filter((m) => m.status === 'CRITICAL').length
  const maintenanceDue = MACHINES.filter((m) => m.maintenance_overdue).length
  const avgRul = MACHINES.reduce((s, m) => s + m.rul_hours, 0) / total
  const avgRisk = MACHINES.reduce((s, m) => s + m.failure_probability, 0) / total
  const totalRepairCost = MACHINES.reduce((s, m) => s + m.estimated_repair_cost, 0)

  return {
    total,
    healthy,
    atRisk,
    critical,
    maintenanceDue,
    avgRul: Number(avgRul.toFixed(1)),
    avgRisk: Number(avgRisk.toFixed(1)),
    totalRepairCost,
  }
}
