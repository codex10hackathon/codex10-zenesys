import { findMachine } from '../data/machines'

function delay(ms = 200) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const STAGES = ['Purchase', 'Deployment', 'Operation', 'Maintenance', 'Repair', 'Upgrade', 'Sell / Retire']

function currentStageFor(machine) {
  if (machine.risk_level === 'CRITICAL') return 'Repair'
  if (machine.age_years >= 7) return 'Sell / Retire'
  if (machine.risk_level === 'HIGH') return 'Maintenance'
  if (machine.age_years >= 4) return 'Upgrade'
  return 'Operation'
}

export async function getLifecycle(machineId) {
  await delay(250)
  const machine = findMachine(machineId)
  if (!machine) throw new Error('Machine not found')

  const currentStage = currentStageFor(machine)
  const currentIndex = STAGES.indexOf(currentStage)

  let recommendation
  if (currentStage === 'Sell / Retire') {
    recommendation = 'Asset has exceeded optimal service life. Recommend resale evaluation or retirement.'
  } else if (currentStage === 'Repair') {
    recommendation = 'Critical failure risk detected. Schedule repair before continued operation.'
  } else if (currentStage === 'Upgrade') {
    recommendation = 'Asset is aging past mid-life. Evaluate component upgrade to extend useful life.'
  } else if (currentStage === 'Maintenance') {
    recommendation = 'Elevated risk detected. Preventive maintenance recommended within the current cycle.'
  } else {
    recommendation = 'Asset is operating within normal parameters. Continue standard monitoring.'
  }

  return {
    machine_id: machineId,
    stages: STAGES,
    current_stage: currentStage,
    current_index: currentIndex,
    machine_age_years: machine.age_years,
    operating_hours: machine.operating_hours_total,
    failures: machine.failure_count,
    maintenance_cost: machine.maintenance_cost_total,
    repair_cost: machine.estimated_repair_cost,
    rul_hours: machine.rul_hours,
    risk_level: machine.risk_level,
    health_score: machine.health_score,
    recommendation,
  }
}
