import { CATEGORIES } from '../data/categories'
import type { AllowanceEntry } from './allowance'

export const STORAGE_KEY = 'smart-allowance-manager.entries'

const validCategoryIds = new Set<string>(
  CATEGORIES.map((category) => category.id),
)

const isValidDateKey = (value: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)

  if (!match) {
    return false
  }

  const [, year, month, day] = match
  const parsedDate = new Date(Number(year), Number(month) - 1, Number(day))

  return (
    parsedDate.getFullYear() === Number(year) &&
    parsedDate.getMonth() === Number(month) - 1 &&
    parsedDate.getDate() === Number(day)
  )
}

const isParseableDateTime = (value: string) =>
  Number.isFinite(new Date(value).getTime())

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
    validCategoryIds.has(entry.categoryId) &&
    typeof entry.date === 'string' &&
    isValidDateKey(entry.date) &&
    typeof entry.createdAt === 'string' &&
    isParseableDateTime(entry.createdAt)
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

export function saveEntries(entries: AllowanceEntry[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
    return true
  } catch {
    return false
  }
}

export function clearEntries(): boolean {
  try {
    localStorage.removeItem(STORAGE_KEY)
    return true
  } catch {
    return false
  }
}
