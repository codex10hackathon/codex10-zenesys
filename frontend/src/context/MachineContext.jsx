import React, { createContext, useContext, useState, useCallback } from 'react'

const MachineContext = createContext(null)

export function MachineProvider({ children }) {
  const [selectedMachineId, setSelectedMachineId] = useState(null)
  const [lastAnalysis, setLastAnalysis] = useState(null)

  const selectMachine = useCallback((id) => setSelectedMachineId(id), [])

  return (
    <MachineContext.Provider value={{ selectedMachineId, selectMachine, lastAnalysis, setLastAnalysis }}>
      {children}
    </MachineContext.Provider>
  )
}

export function useMachineContext() {
  const ctx = useContext(MachineContext)
  if (!ctx) throw new Error('useMachineContext must be used within MachineProvider')
  return ctx
}
