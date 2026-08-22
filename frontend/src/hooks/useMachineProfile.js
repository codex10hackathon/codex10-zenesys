import { useEffect, useState, useCallback } from 'react'
import { getMachineById } from '../services/machineService'

export function useMachineProfile(machineId) {
  const [machine, setMachine] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const reload = useCallback(() => {
    if (!machineId) return
    setLoading(true)
    setError(null)
    getMachineById(machineId)
      .then(setMachine)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [machineId])

  useEffect(() => {
    reload()
  }, [reload])

  return { machine, loading, error, reload }
}
