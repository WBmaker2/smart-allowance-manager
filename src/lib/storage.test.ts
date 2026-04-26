import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { createAllowanceEntry } from './allowance'
import { clearEntries, loadEntries, saveEntries, STORAGE_KEY } from './storage'

beforeEach(() => localStorage.clear())
afterEach(() => vi.restoreAllMocks())

test('saves and loads allowance entries', () => {
  const entry = createAllowanceEntry({
    item: '공책',
    amount: 1500,
    categoryId: 'school',
    date: '2026-04-26',
  })

  expect(saveEntries([entry])).toBe(true)

  expect(loadEntries()).toEqual([entry])
})

test('falls back to empty list for malformed localStorage data', () => {
  localStorage.setItem(STORAGE_KEY, '{broken')

  expect(loadEntries()).toEqual([])
})

test('falls back to empty list when localStorage getItem throws', () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new DOMException('Blocked storage access', 'SecurityError')
  })

  expect(loadEntries()).toEqual([])
})

test('falls back to empty list when stored data is not an array', () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ entries: [] }))

  expect(loadEntries()).toEqual([])
})

test('drops incompatible records while keeping valid entries unchanged', () => {
  const validEntry = createAllowanceEntry({
    item: '저금',
    amount: 2000,
    categoryId: 'saving',
    date: '2026-04-26',
  })

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify([
      validEntry,
      { ...validEntry, id: undefined },
      { ...validEntry, amount: Number.POSITIVE_INFINITY },
      { ...validEntry, categoryId: 'unknown' },
      { ...validEntry, date: '2026-02-31' },
      { ...validEntry, createdAt: 123 },
      { ...validEntry, createdAt: 'not-a-date' },
    ]),
  )

  expect(loadEntries()).toEqual([validEntry])
})

test('drops entries with malformed date strings while keeping valid entries', () => {
  const validEntry = createAllowanceEntry({
    item: '저금',
    amount: 2000,
    categoryId: 'saving',
    date: '2026-04-26',
  })

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify([
      { ...validEntry, id: 'bad-date-text', date: 'not-a-date' },
      { ...validEntry, id: 'bad-date-shape', date: '2026-4-26' },
      validEntry,
    ]),
  )

  expect(loadEntries()).toEqual([validEntry])
})

test('clears entries', () => {
  expect(saveEntries([
    createAllowanceEntry({
      item: '저금',
      amount: 2000,
      categoryId: 'saving',
      date: '2026-04-26',
    }),
  ])).toBe(true)

  expect(clearEntries()).toBe(true)

  expect(loadEntries()).toEqual([])
})

test('does not throw when localStorage setItem throws', () => {
  const entry = createAllowanceEntry({
    item: '공책',
    amount: 1500,
    categoryId: 'school',
    date: '2026-04-26',
  })

  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('Storage quota exceeded', 'QuotaExceededError')
  })

  expect(saveEntries([entry])).toBe(false)
})

test('does not throw when localStorage removeItem throws', () => {
  vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
    throw new DOMException('Blocked storage access', 'SecurityError')
  })

  expect(clearEntries()).toBe(false)
})
