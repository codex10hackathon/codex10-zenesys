import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  Settings2,
  Sparkles,
  Wrench,
  Settings,
  LogOut,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const NAV_ITEMS = [
  { to: '/machines', label: 'Machines', icon: Settings2 },
  { to: '/maintenance', label: 'Maintenance', icon: Wrench },
  { to: '/copilot', label: 'AI Copilot', icon: Sparkles },
]

export default function Sidebar() {
  const { user, logout } = useAuth()

  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-[var(--border-subtle)] bg-[var(--navy-deep)] text-slate-200">
      <div className="flex items-center gap-2 border-b border-white/10 px-5 py-5">
        <div className="leading-tight">
          <p className="text-[15px] font-semibold text-white">AssetIQ</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-0.5">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-3 rounded-md px-3 py-2 text-[13.5px] font-medium transition-colors focus-ring',
                    isActive
                      ? 'bg-navy-700 text-white'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white',
                  ].join(' ')
                }
              >
                <Icon size={17} strokeWidth={2} />
                <span>{label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-white/10 px-3 py-4">
        <div className="mb-2 flex items-center gap-2.5 rounded-md px-3 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy-600 text-[12px] font-semibold text-white">
            {(user?.name || 'AR')
              .split(' ')
              .map((p) => p[0])
              .join('')
              .slice(0, 2)}
          </div>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-[13px] font-medium text-white">{user?.name || 'Alex Rao'}</p>
          </div>
        </div>
        <ul className="space-y-0.5">
          <li>
            <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-[13px] font-medium text-slate-300 hover:bg-white/5 hover:text-white focus-ring">
              <Settings size={16} strokeWidth={2} />
              Settings
            </button>
          </li>
          <li>
            <button
              onClick={logout}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-[13px] font-medium text-slate-300 hover:bg-white/5 hover:text-white focus-ring"
            >
              <LogOut size={16} strokeWidth={2} />
              Logout
            </button>
          </li>
        </ul>
      </div>
    </aside>
  )
}
