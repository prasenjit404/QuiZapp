import React from 'react'

export default function Spinner({ size=24 }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="inline-block animate-spin rounded-full border-2 border-foreground/30 border-t-accent"
      style={{ width: size, height: size }}
    />
  )
}