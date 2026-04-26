import type { AllowanceEntry } from './allowance'

export const STORAGE_KEY = 'smart-allowance-manager.entries'

const isStorageEntry = (value: unknown): value is AllowanceEntry => {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const entry = value as Record<string, unknown>

  return (
    typeof entry.id === 'string' &&
    typeof entry.item === 'string' &&
    typeof entry.amount === 'number' &&
    Number.isFinite(entry.amount) &&
    typeof entry.categoryId === 'string' &&
    typeof entry.date === 'string' &&
    typeof entry.createdAt === 'string'
  )
}

export function loadEntries(): AllowanceEntry[] {
  let storedEntries: string | null

  try {
    storedEntries = localStorage.getItem(STORAGE_KEY)
  } catch {
    return []
  }

  if (storedEntries === null) {
    return []
  }

  try {
    const parsedEntries: unknown = JSON.parse(storedEntries)

    if (!Array.isArray(parsedEntries)) {
      return []
    }

    return parsedEntries.filter(isStorageEntry)
  } catch {
    return []
  }
}

export function saveEntries(entries: AllowanceEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch {
    return
  }
}

export function clearEntries(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    return
  }
}
