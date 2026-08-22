import React, { useEffect, useRef, useState } from 'react'
import { Sparkles, Send, Bot, User } from 'lucide-react'
import Layout from '../components/Layout'
import Card from '../components/Card'
import { RiskBadge } from '../components/Badges'
import { useMachines } from '../hooks/useMachines'
import { useMachineContext } from '../context/MachineContext'
import { askCopilot, SUGGESTED_QUESTIONS } from '../services/api'
import { formatNumber } from '../utils/format'

export default function Copilot() {
  const { machines } = useMachines()
  const { selectedMachineId, selectMachine } = useMachineContext()
  const [machineId, setMachineId] = useState(selectedMachineId || '')
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (machines.length > 0 && !machineId) {
      const id = selectedMachineId || machines[0].id
      setMachineId(id)
    }
  }, [machines, machineId, selectedMachineId])

  useEffect(() => {
    if (machineId) {
      selectMachine(machineId)
      setMessages([
        {
          role: 'assistant',
          text: `I'm looking at ${machineId}'s current condition and prediction data. Ask me about risk, maintenance timing, repair cost, or resale value.`,
        },
      ])
    }
  }, [machineId, selectMachine])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  const machine = machines.find((m) => m.id === machineId)

  async function sendMessage(text) {
    const question = (text ?? input).trim()
    if (!question || loading) return
    setMessages((prev) => [...prev, { role: 'user', text: question }])
    setInput('')
    setLoading(true)
    try {
      const answer = await askCopilot(machineId, question)
      setMessages((prev) => [...prev, { role: 'assistant', text: answer }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout title="AI Copilot" subtitle="An engineering assistant grounded in your fleet's live data">
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-1" title="Asset Context">
          <label className="mb-1.5 block text-[12.5px] font-medium text-[var(--text-secondary)]">Machine</label>
          <select
            value={machineId}
            onChange={(e) => setMachineId(e.target.value)}
            className="mb-4 w-full rounded border border-[var(--border-strong)] bg-white px-3 py-2 text-[13.5px] focus-ring"
          >
            {machines.map((m) => (
              <option key={m.id} value={m.id}>
                {m.id} — {m.machine_type}
              </option>
            ))}
          </select>

          {machine && (
            <div className="space-y-2.5 rounded border border-[var(--border-subtle)] bg-[var(--bg-app)] p-4">
              <div className="flex items-center justify-between">
                <span className="text-[12.5px] text-[var(--text-secondary)]">Risk Level</span>
                <RiskBadge risk={machine.risk_level} />
              </div>
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-[var(--text-secondary)]">Failure Probability</span>
                <span className="font-semibold tabular-nums text-[var(--text-primary)]">{formatNumber(machine.failure_probability, 1)}%</span>
              </div>
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-[var(--text-secondary)]">RUL</span>
                <span className="font-semibold tabular-nums text-[var(--text-primary)]">{formatNumber(machine.rul_hours, 0)} h</span>
              </div>
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-[var(--text-secondary)]">Health Score</span>
                <span className="font-semibold tabular-nums text-[var(--text-primary)]">{machine.health_score}/100</span>
              </div>
            </div>
          )}

          <p className="mb-2 mt-5 text-[12px] font-medium uppercase tracking-wide text-[var(--text-muted)]">Suggested Questions</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className="rounded-full border border-navy-100 bg-navy-50 px-3 py-1.5 text-left text-[12px] font-medium text-navy-700 hover:bg-navy-100 focus-ring"
              >
                {q}
              </button>
            ))}
          </div>
        </Card>

        <Card
          className="flex flex-col xl:col-span-2"
          noPadding
          title={
            <span className="flex items-center gap-2">
              <Sparkles size={15} className="text-navy-600" /> Asset Copilot
            </span>
          }
          subtitle={machine ? `Context: ${machine.id} · ${machine.machine_type}` : ''}
        >
          <div ref={scrollRef} className="h-[440px] space-y-4 overflow-y-auto px-5 py-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-2.5 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                    m.role === 'user' ? 'bg-navy-100 text-navy-700' : 'bg-navy-700 text-white'
                  }`}
                >
                  {m.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                </div>
                <div
                  className={`max-w-[80%] rounded-md px-3.5 py-2.5 text-[13.5px] leading-relaxed ${
                    m.role === 'user' ? 'bg-navy-700 text-white' : 'border border-[var(--border-subtle)] bg-[var(--bg-app)] text-[var(--text-primary)]'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy-700 text-white">
                  <Bot size={14} />
                </div>
                <div className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-app)] px-3.5 py-2.5 text-[13px] text-[var(--text-muted)]">
                  Analyzing asset data…
                </div>
              </div>
            )}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              sendMessage()
            }}
            className="flex items-center gap-2 border-t border-[var(--border-subtle)] px-4 py-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about risk, maintenance, cost, or resale…"
              className="flex-1 rounded border border-[var(--border-strong)] px-3 py-2 text-[13.5px] focus-ring"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex h-9 w-9 items-center justify-center rounded bg-navy-700 text-white hover:bg-navy-800 disabled:bg-navy-300 focus-ring"
            >
              <Send size={15} />
            </button>
          </form>
        </Card>
      </div>
    </Layout>
  )
}
