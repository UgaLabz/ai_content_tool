import * as React from 'react'
import { cn } from '@/utils/cn'

interface SliderProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
  onValueChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  label?: string
  showValue?: boolean
}

const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  (
    {
      className,
      value,
      onValueChange,
      min = 0,
      max = 100,
      step = 1,
      label,
      showValue = true,
      ...props
    },
    ref
  ) => {
    const percentage = ((value - min) / (max - min)) * 100

    return (
      <div ref={ref} className={cn('space-y-2', className)} {...props}>
        {(label || showValue) && (
          <div className="flex items-center justify-between">
            {label && (
              <span className="text-sm font-medium leading-none">{label}</span>
            )}
            {showValue && (
              <span className="text-sm text-muted-foreground">{value}</span>
            )}
          </div>
        )}
        <div className="relative">
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onValueChange(Number(e.target.value))}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </div>
      </div>
    )
  }
)
Slider.displayName = 'Slider'

export { Slider }