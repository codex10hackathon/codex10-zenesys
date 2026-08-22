import { findMachine } from '../data/machines'

function delay(ms = 250) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const REPLACEMENT_COST = { CNC: 1450000, Pump: 420000, Compressor: 980000, 'Robotic Arm': 1750000, Motor: 560000, Conveyor: 380000 }

export async function getResaleValuation(machineId) {
  await delay(300)
  const machine = findMachine(machineId)
  if (!machine) throw new Error('Machine not found')

  const replacementCost = REPLACEMENT_COST[machine.machine_type] || 500000
  const ageFactor = Math.max(0.12, 1 - machine.age_years * 0.11)
  const healthFactor = machine.health_score / 100
  const riskPenalty = machine.risk_level === 'CRITICAL' ? 0.55 : machine.risk_level === 'HIGH' ? 0.75 : machine.risk_level === 'MODERATE' ? 0.9 : 1

  const currentValue = Math.round((replacementCost * ageFactor * healthFactor * riskPenalty) / 500) * 500

  const projection = [0, 1, 2, 3].map((yearOffset) => {
    const decay = Math.pow(0.82, yearOffset)
    return {
      year: yearOffset === 0 ? 'Current' : `+${yearOffset}Y`,
      value: Math.round((currentValue * decay) / 500) * 500,
    }
  })

  const factors = [
    { label: 'Machine Age', detail: `${machine.age_years} years`, impact: machine.age_years > 5 ? 'Negative' : 'Neutral' },
    { label: 'Health Score', detail: `${machine.health_score} / 100`, impact: machine.health_score > 70 ? 'Positive' : 'Negative' },
    { label: 'Failure Risk', detail: machine.risk_level, impact: machine.risk_level === 'LOW' ? 'Positive' : 'Negative' },
    { label: 'Maintenance History', detail: `₹${machine.maintenance_cost_total.toLocaleString('en-IN')} spent`, impact: 'Neutral' },
    { label: 'Operating Hours', detail: `${machine.operating_hours_total.toLocaleString('en-IN')} hrs`, impact: machine.operating_hours_total > 30000 ? 'Negative' : 'Neutral' },
  ]

  const sellRecommendation =
    machine.risk_level === 'CRITICAL' || machine.age_years >= 7
      ? 'Recommend resale within the next 6 months to maximize recovery value before further depreciation.'
      : 'Asset retains healthy resale value. No immediate action required.'

  return {
    machine_id: machineId,
    current_value: currentValue,
    projection,
    factors,
    sell_recommendation: sellRecommendation,
    disclaimer: 'Estimated Resale Value — model-based approximation, not an actual market price or appraisal.',
  }
}
