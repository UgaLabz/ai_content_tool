import * as React from 'react'
import { X } from 'lucide-react'
import { cn } from '@/utils/cn'

interface ToastProps {
  title: string
  description?: string
  variant?: 'default' | 'success' | 'error' | 'warning'
  onClose: () => void
}

export function Toast({ title, description, variant = 'default', onClose }: ToastProps) {
  React.useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 5000)

    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div
      className={cn(
        'pointer-events-auto flex w-full max-w-md rounded-lg shadow-lg',
        {
          'bg-background border': variant === 'default',
          'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800': variant === 'success',
          'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800': variant === 'error',
          'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800': variant === 'warning',
        }
      )}
    >
      <div className="flex-1 p-4">
        <p className={cn(
          'text-sm font-semibold',
          {
            'text-foreground': variant === 'default',
            'text-green-900 dark:text-green-100': variant === 'success',
            'text-red-900 dark:text-red-100': variant === 'error',
            'text-yellow-900 dark:text-yellow-100': variant === 'warning',
          }
        )}>
          {title}
        </p>
        {description && (
          <p className={cn(
            'mt-1 text-sm',
            {
              'text-muted-foreground': variant === 'default',
              'text-green-700 dark:text-green-200': variant === 'success',
              'text-red-700 dark:text-red-200': variant === 'error',
              'text-yellow-700 dark:text-yellow-200': variant === 'warning',
            }
          )}>
            {description}
          </p>
        )}
      </div>
      <button
        onClick={onClose}
        className="p-4 hover:opacity-70 transition-opacity"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}

interface ToastContainerProps {
  toasts: Array<{
    id: string
    title: string
    description?: string
    variant?: 'default' | 'success' | 'error' | 'warning'
  }>
  onClose: (id: string) => void
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div className="fixed bottom-0 right-0 z-50 flex flex-col gap-2 p-4 pointer-events-none">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={() => onClose(toast.id)}
        />
      ))}
    </div>
  )
}