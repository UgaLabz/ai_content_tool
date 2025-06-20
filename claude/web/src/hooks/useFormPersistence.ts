import { useEffect } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { storage } from '@/utils/storage'

export function useFormPersistence<T extends Record<string, any>>(
  form: UseFormReturn<T>,
  storageKey: string,
  options?: {
    debounceMs?: number
    exclude?: (keyof T)[]
  }
) {
  const { watch, reset } = form
  const { debounceMs = 1000, exclude = [] } = options || {}

  // Load saved data on mount
  useEffect(() => {
    const savedData = storage.get<Partial<T>>(storageKey, {})
    if (Object.keys(savedData).length > 0) {
      reset(savedData as T)
    }
  }, [storageKey, reset])

  // Save data on change
  useEffect(() => {
    const subscription = watch((data) => {
      // Remove excluded fields
      const dataToSave = { ...data }
      exclude.forEach((field) => {
        delete dataToSave[field]
      })

      // Debounced save
      const timeoutId = setTimeout(() => {
        storage.set(storageKey, dataToSave)
      }, debounceMs)

      return () => clearTimeout(timeoutId)
    })

    return () => subscription.unsubscribe()
  }, [watch, storageKey, debounceMs, exclude])

  // Clear saved data
  const clearSavedData = () => {
    storage.remove(storageKey)
  }

  return { clearSavedData }
}