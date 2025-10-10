import React from 'react'
import clsx from 'classnames'

export default function Input({ className, ...props }) {
  return (
    <input
      className={clsx('w-full rounded-md border border-border bg-card px-3 py-2 outline-none focus:ring-2 focus:ring-accent/40', className)}
      {...props}
    />
  )
}