import { findMachine } from '../data/machines'
import { getResaleValuation } from './resaleService'

function delay(ms = 700) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function fmtCurrency(v) {
  return `₹${Number(v).toLocaleString('en-IN')}`
}

export const SUGGESTED_QUESTIONS = [
  'Why is this machine high risk?',
  'When should I maintain it?',
  'Should I repair or replace it?',
  'What is the repair cost?',
  'What is the estimated resale value?',
  'Should we sell next year?',
]

/**
 * Grounded, rules-based response generator standing in for a backend LLM
 * call. In production this would call POST /api/copilot with the machine_id
 * and question, and the service would inject live telemetry + prediction
 * context into the model prompt server-side.
 */
export async function askCopilot(machineId, question) {
  await delay(750)
  const machine = findMachine(machineId)
  if (!machine) {
    return "Select a machine first so I can pull its live condition and prediction data."
  }

  const q = question.toLowerCase()

  if (q.includes('why') && q.includes('risk')) {
    return `${machine.id} shows a ${machine.failure_probability}% failure probability (${machine.risk_level}). This is driven primarily by ${machine.hours_since_maintenance.toFixed(0)} hours of run time since the last service and a vibration RMS reading of ${machine.vibration_rms}, both above the normal band for a ${machine.machine_type.toLowerCase()}. The model's leading failure mode is ${machine.failure_type}.`
  }

  if (q.includes('when') && q.includes('maintain')) {
    return `Based on the previous maintenance date (${machine.previous_maintenance_date}) and a ${machine.maintenance_interval_days}-day recommended interval, the next scheduled maintenance is ${machine.next_maintenance_date}. Given the current ${machine.risk_level.toLowerCase()} risk level, I'd recommend ${machine.risk_level === 'HIGH' || machine.risk_level === 'CRITICAL' ? 'bringing this forward rather than waiting for the scheduled date' : 'keeping to the scheduled date'}.`
  }

  if (q.includes('repair or replace') || (q.includes('repair') && q.includes('replace'))) {
    const resale = await getResaleValuation(machineId)
    return `Estimated repair cost is ${fmtCurrency(machine.estimated_repair_cost)}, against an estimated resale value of ${fmtCurrency(resale.current_value)}. ${
      machine.estimated_repair_cost > resale.current_value * 0.45
        ? 'Repair cost is high relative to resale value — replacement or upgrade is worth evaluating.'
        : 'Repair remains the more cost-effective option at this stage of the asset lifecycle.'
    }`
  }

  if (q.includes('repair cost') || (q.includes('cost') && !q.includes('resale'))) {
    return `The estimated repair cost for ${machine.id} is ${fmtCurrency(machine.estimated_repair_cost)}, based on the predicted failure mode (${machine.failure_type}) and current health score of ${machine.health_score}/100.`
  }

  if (q.includes('resale value') || (q.includes('resale') && q.includes('what'))) {
    const resale = await getResaleValuation(machineId)
    return `Current estimated resale value for ${machine.id} is ${fmtCurrency(resale.current_value)}. This is a model-based estimate, not a market appraisal — see the Resale page for the full depreciation projection.`
  }

  if (q.includes('sell') && q.includes('next year')) {
    const resale = await getResaleValuation(machineId)
    const oneYear = resale.projection.find((p) => p.year === '+1Y')
    return `Holding this asset one more year would bring its estimated value down to roughly ${fmtCurrency(oneYear.value)}, a drop of ${fmtCurrency(resale.current_value - oneYear.value)} from today. ${resale.sell_recommendation}`
  }

  return `Here's what I have on ${machine.id}: ${machine.risk_level} risk (${machine.failure_probability}%), ${machine.rul_hours}h remaining useful life, health score ${machine.health_score}/100. Ask me about maintenance timing, repair cost, or resale value for more detail.`
}
