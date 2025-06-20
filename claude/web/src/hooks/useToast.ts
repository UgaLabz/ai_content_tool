import { useState, useCallback } from 'react'
import { generateId } from '@/utils/common'

export interface Toast {
  id: string
  title: string
  description?: string
  variant?: 'default' | 'success' | 'error' | 'warning'
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = generateId()
    setToasts((prev) => [...prev, { ...toast, id }])
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const success = useCallback((title: string, description?: string) => {
    toast({ title, description, variant: 'success' })
  }, [toast])

  const error = useCallback((title: string, description?: string) => {
    toast({ title, description, variant: 'error' })
  }, [toast])

  const warning = useCallback((title: string, description?: string) => {
    toast({ title, description, variant: 'warning' })
  }, [toast])

  return {
    toasts,
    toast,
    dismiss,
    success,
    error,
    warning,
  }
}