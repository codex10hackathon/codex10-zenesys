import { getUpcomingMaintenance, MACHINES } from '../data/machines'

function delay(ms = 200) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function getRecords() {
  await delay()
  return []
}

export async function getUpcoming() {
  await delay()
  return getUpcomingMaintenance()
}

/**
 * Mocks a backend endpoint that computes the maintenance schedule from a
 * single input date. The frontend never derives this itself.
 * e.g. POST /api/maintenance-schedule { previous_maintenance_date }
 */
export async function computeSchedule(previousMaintenanceDate) {
  await delay(400)
  const prev = new Date(previousMaintenanceDate)
  const intervalDays = 30
  const next = new Date(prev)
  next.setDate(next.getDate() + intervalDays)
  const today = new Date('2026-08-22')
  const status = next < today ? 'OVERDUE' : (next - today) / 86400000 <= 7 ? 'DUE_SOON' : 'SCHEDULED'

  return {
    previous_maintenance_date: previousMaintenanceDate,
    recommended_interval_days: intervalDays,
    next_maintenance_date: next.toISOString().slice(0, 10),
    maintenance_status: status,
  }
}

export async function getCalendarEvents() {
  await delay()
  return MACHINES.map((m) => ({
    machine_id: m.id,
    machine_type: m.machine_type,
    date: m.next_maintenance_date,
    overdue: m.maintenance_overdue,
    risk_level: m.risk_level,
  }))
}
