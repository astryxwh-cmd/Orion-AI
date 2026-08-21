import { forwardRef } from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/utils/cn'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  iconLeft?: ReactNode
  iconRight?: ReactNode
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-violet-600 text-white hover:bg-violet-500 active:bg-violet-700 shadow-sm shadow-violet-950/40',
  secondary:
    'border border-zinc-700 bg-zinc-800/80 text-zinc-100 hover:bg-zinc-700/70',
  outline:
    'border border-zinc-700 text-zinc-200 hover:border-zinc-500 hover:bg-zinc-800/70',
  ghost: 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/70',
  danger: 'bg-red-600 text-white hover:bg-red-500',
}

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'h-7 gap-1.5 rounded-md px-2.5 text-xs',
  md: 'h-9 gap-2 rounded-lg px-3.5 text-sm',
  lg: 'h-11 gap-2 rounded-xl px-5 text-sm',
  icon: 'h-8 w-8 rounded-lg',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'secondary',
    size = 'md',
    iconLeft,
    iconRight,
    className,
    children,
    type = 'button' as const,
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex select-none items-center justify-center font-medium transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-violet-500/60 disabled:pointer-events-none disabled:opacity-50',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      )}
      {...props}
    >
      {iconLeft}
      {children}
      {iconRight}
    </button>
  )
})