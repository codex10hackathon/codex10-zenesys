import { useEffect, useState, useCallback } from 'react'
import { getMachines } from '../services/machineService'

export function useMachines() {
  const [machines, setMachines] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const reload = useCallback(() => {
    setLoading(true)
    getMachines()
      .then(setMachines)
      .catch(setError)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  return { machines, loading, error, reload }
}
