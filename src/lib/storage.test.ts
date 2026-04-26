import { beforeEach, expect, test } from 'vitest'
import { createAllowanceEntry } from './allowance'
import { clearEntries, loadEntries, saveEntries, STORAGE_KEY } from './storage'

beforeEach(() => localStorage.clear())

test('saves and loads allowance entries', () => {
  const entry = createAllowanceEntry({
    item: '공책',
    amount: 1500,
    categoryId: 'school',
    date: '2026-04-26',
  })

  saveEntries([entry])

  expect(loadEntries()).toEqual([entry])
})

test('falls back to empty list for malformed localStorage data', () => {
  localStorage.setItem(STORAGE_KEY, '{broken')

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
      { ...validEntry, createdAt: 123 },
    ]),
  )

  expect(loadEntries()).toEqual([validEntry])
})

test('clears entries', () => {
  saveEntries([
    createAllowanceEntry({
      item: '저금',
      amount: 2000,
      categoryId: 'saving',
      date: '2026-04-26',
    }),
  ])

  clearEntries()

  expect(loadEntries()).toEqual([])
})
