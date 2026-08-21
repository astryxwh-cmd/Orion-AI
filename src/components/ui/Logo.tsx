import { Sparkles } from 'lucide-react'
import { cn } from '@/utils/cn'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  withText?: boolean
  className?: string
}

const BOX_SIZES = {
  sm: 'h-6 w-6 rounded-md',
  md: 'h-8 w-8 rounded-lg',
  lg: 'h-11 w-11 rounded-xl',
} as const

const ICON_SIZES = { sm: 12, md: 16, lg: 22 } as const

export function Logo({ size = 'md', withText = true, className }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div
        className={cn(
          'relative flex items-center justify-center bg-gradient-to-br from-violet-500 to-violet-700 shadow-lg shadow-violet-950/50',
          BOX_SIZES[size],
        )}
      >
        <Sparkles
          className="relative text-white"
          size={ICON_SIZES[size]}
          strokeWidth={2.2}
        />
      </div>
      {withText && (
        <span className="text-[15px] font-bold tracking-tight text-white">
          Orion <span className="text-violet-400">AI</span>
        </span>
      )}
    </div>
  )
}