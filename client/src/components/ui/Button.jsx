import React from 'react'
import clsx from 'classnames'

export default function Button({ as:Comp='button', className, variant='primary', size='md', ...props }) {
  const base = 'inline-flex items-center justify-center rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:pointer-events-none transition-transform active:scale-[0.98]'
  const sizes = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-10 px-4',
    lg: 'h-12 px-5 text-lg'
  }
  const variants = {
    primary: 'bg-accent text-white hover:opacity-90 focus:ring-accent/40 ring-offset-background',
    ghost: 'bg-transparent hover:bg-foreground/5 text-foreground focus:ring-border ring-offset-background',
    outline: 'border border-border bg-card hover:bg-foreground/5 text-foreground focus:ring-border ring-offset-background'
  }
  return <Comp className={clsx(base, sizes[size], variants[variant], className)} {...props} />
}