import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail] = useState('alex.rao@assetiq.com')
  const [password, setPassword] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  function handleSubmit(e) {
    e.preventDefault()
    login('Alex Rao')
    navigate('/dashboard')
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[var(--bg-app)] px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <h1 className="text-[19px] font-semibold text-[var(--text-primary)]">AssetIQ</h1>
          <p className="mt-1 text-[13px] text-[var(--text-secondary)]"></p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-md border border-[var(--border-subtle)] bg-white p-6 shadow-card"
        >
          <div className="mb-4">
            <label className="mb-1.5 block text-[12.5px] font-medium text-[var(--text-secondary)]">Work Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded border border-[var(--border-strong)] px-3 py-2 text-[13.5px] focus-ring"
            />
          </div>
          <div className="mb-4">
            <label className="mb-1.5 block text-[12.5px] font-medium text-[var(--text-secondary)]">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded border border-[var(--border-strong)] px-3 py-2 text-[13.5px] focus-ring"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded bg-navy-700 px-4 py-2.5 text-[13.5px] font-semibold text-white hover:bg-navy-800 focus-ring"
          >
            Sign In
          </button>
        </form>
        <p className="mt-4 text-center text-[12px] text-[var(--text-muted)]">
          Demo build — sign-in is simulated, no credentials are verified.
        </p>
      </div>
    </div>
  )
}
