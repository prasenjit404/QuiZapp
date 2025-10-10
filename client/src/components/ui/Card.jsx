import React from 'react'

export function Card({ className='', children }) {
  return <div className={`rounded-xl bg-card shadow-soft border border-border ${className}`}>{children}</div>
}

export function CardHeader({ title, subtitle, right }) {
  return (
    <div className="flex items-center justify-between p-4 border-b border-border/70">
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        {subtitle && <p className="text-sm text-muted mt-1">{subtitle}</p>}
      </div>
      {right}
    </div>
  )
}

export function CardBody({ className='', children }) {
  return <div className={`p-4 ${className}`}>{children}</div>
}