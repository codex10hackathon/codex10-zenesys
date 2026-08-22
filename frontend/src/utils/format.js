export function formatCurrency(value) {
  if (value === null || value === undefined) return '—'
  return `₹${Number(value).toLocaleString('en-IN')}`
}

export function formatNumber(value, decimals = 1) {
  if (value === null || value === undefined) return '—'
  return Number(value).toFixed(decimals)
}

export function formatDateDisplay(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatDateTimeDisplay(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return `${d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} ${d.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  })}`
}

export const STATUS_META = {
  HEALTHY: { label: 'Healthy', color: '#1f8a4c', bg: '#e9f6ee', border: '#bfe4cd' },
  WATCH: { label: 'Watch', color: '#8a6d1f', bg: '#faf3e3', border: '#eddca3' },
  AT_RISK: { label: 'At Risk', color: '#b3560f', bg: '#fdf0e5', border: '#f3cda3' },
  CRITICAL: { label: 'Critical', color: '#c02929', bg: '#fceaea', border: '#f3bcbc' },
}

export const RISK_META = {
  LOW: { label: 'LOW RISK', color: '#1f8a4c', bg: '#e9f6ee', border: '#bfe4cd' },
  MODERATE: { label: 'MODERATE RISK', color: '#8a6d1f', bg: '#faf3e3', border: '#eddca3' },
  HIGH: { label: 'HIGH RISK', color: '#b3560f', bg: '#fdf0e5', border: '#f3cda3' },
  CRITICAL: { label: 'CRITICAL RISK', color: '#c02929', bg: '#fceaea', border: '#f3bcbc' },
}

export function statusMeta(status) {
  return STATUS_META[status] || STATUS_META.HEALTHY
}

export function riskMeta(risk) {
  return RISK_META[risk] || RISK_META.LOW
}
