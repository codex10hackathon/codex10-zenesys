import React from 'react'

export default function Card({ title, subtitle, actions, children, className = '', bodyClassName = '', noPadding = false }) {
  return (
    <div className={`rounded-md border border-[var(--border-subtle)] bg-white shadow-card ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-3.5">
          <div>
            {title && <h3 className="text-[13.5px] font-semibold text-[var(--text-primary)]">{title}</h3>}
            {subtitle && <p className="mt-0.5 text-[12px] text-[var(--text-muted)]">{subtitle}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className={noPadding ? bodyClassName : `p-5 ${bodyClassName}`}>{children}</div>
    </div>
  )
}
