import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Machines from './pages/Machines'
import MachineProfile from './pages/MachineProfile'
import Analytics from './pages/Analytics'
import Maintenance from './pages/Maintenance'
import Lifecycle from './pages/Lifecycle'
import Resale from './pages/Resale'
import Copilot from './pages/Copilot'

function ProtectedRoute({ children }) {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/machines" replace />} />
      <Route
        path="/dashboard"
        element={<Navigate to="/machines" replace />}
      />
      <Route
        path="/machines"
        element={
          <ProtectedRoute>
            <Machines />
          </ProtectedRoute>
        }
      />
      <Route
        path="/machines/:machineId"
        element={
          <ProtectedRoute>
            <MachineProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <Analytics />
          </ProtectedRoute>
        }
      />
      <Route
        path="/maintenance"
        element={
          <ProtectedRoute>
            <Maintenance />
          </ProtectedRoute>
        }
      />
      <Route
        path="/lifecycle"
        element={
          <ProtectedRoute>
            <Lifecycle />
          </ProtectedRoute>
        }
      />
      <Route
        path="/resale"
        element={
          <ProtectedRoute>
            <Resale />
          </ProtectedRoute>
        }
      />
      <Route
        path="/copilot"
        element={
          <ProtectedRoute>
            <Copilot />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/machines" replace />} />
    </Routes>
  )
}
