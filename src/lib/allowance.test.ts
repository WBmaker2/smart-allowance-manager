import { expect, test } from 'vitest'
import {
  createAllowanceEntry,
  filterEntriesForWeek,
  getWeeklyInsight,
  summarizeByCategory,
} from './allowance'

test('normalizes entry amount to a positive integer won value', () => {
  const entry = createAllowanceEntry({
    item: '떡볶이',
    amount: '2500.9',
    categoryId: 'snack',
    date: '2026-04-26',
  })

  expect(entry.amount).toBe(2500)
  expect(entry.item).toBe('떡볶이')
})

test('summarizes only the selected school week by category', () => {
  const entries = [
    createAllowanceEntry({
      item: '떡볶이',
      amount: 3000,
      categoryId: 'snack',
      date: '2026-04-20',
    }),
    createAllowanceEntry({
      item: '연필',
      amount: 1000,
      categoryId: 'school',
      date: '2026-04-21',
    }),
    createAllowanceEntry({
      item: '지난주 간식',
      amount: 9000,
      categoryId: 'snack',
      date: '2026-04-12',
    }),
  ]

  const weekEntries = filterEntriesForWeek(
    entries,
    new Date('2026-04-26T12:00:00+09:00'),
  )
  const summary = summarizeByCategory(weekEntries)

  expect(summary).toEqual([
    expect.objectContaining({ categoryId: 'snack', amount: 3000, percent: 75 }),
    expect.objectContaining({ categoryId: 'school', amount: 1000, percent: 25 }),
  ])
})

test('returns a reflection message for a dominant category', () => {
  const insight = getWeeklyInsight([
    createAllowanceEntry({
      item: '간식1',
      amount: 6000,
      categoryId: 'snack',
      date: '2026-04-21',
    }),
    createAllowanceEntry({
      item: '저금',
      amount: 4000,
      categoryId: 'saving',
      date: '2026-04-22',
    }),
  ])

  expect(insight.topCategoryLabel).toBe('간식')
  expect(insight.message).toContain('60%')
})

test('falls back unsafe entry values to usable defaults', () => {
  const entry = createAllowanceEntry({
    item: '  ',
    amount: Number.POSITIVE_INFINITY,
    categoryId: 'unknown',
    date: 'not-a-date',
  })

  expect(entry.item).toBe('')
  expect(entry.amount).toBe(0)
  expect(entry.categoryId).toBe('other')
  expect(entry.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
})

test('rounds category percentages while keeping the sum at 100', () => {
  const summary = summarizeByCategory([
    createAllowanceEntry({ item: 'A', amount: 1, categoryId: 'snack', date: '2026-04-20' }),
    createAllowanceEntry({ item: 'B', amount: 1, categoryId: 'school', date: '2026-04-20' }),
    createAllowanceEntry({ item: 'C', amount: 1, categoryId: 'saving', date: '2026-04-20' }),
  ])

  expect(summary.map((category) => category.percent)).toEqual([34, 33, 33])
  expect(summary.reduce((total, category) => total + category.percent, 0)).toBe(100)
})
