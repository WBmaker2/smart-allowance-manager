import { expect, test } from 'vitest'
import type { AllowanceEntry, CategorySummary } from './allowance'
import { createWeeklyCsv, createWeeklyFileName } from './exportRecords'

const createEntry = (
  overrides: Partial<AllowanceEntry>,
): AllowanceEntry => ({
  id: 'entry-1',
  item: '떡볶이',
  amount: 3000,
  categoryId: 'snack',
  date: '2026-04-26',
  createdAt: '2026-04-26T09:00:00.000Z',
  ...overrides,
})

const createSummary = (
  overrides: Partial<CategorySummary>,
): CategorySummary => ({
  categoryId: 'snack',
  label: '간식',
  color: '#f97316',
  amount: 3000,
  percent: 75,
  ...overrides,
})

test('creates a weekly CSV with sorted entry rows and summary rows', () => {
  const csv = createWeeklyCsv(
    [
      createEntry({
        id: 'entry-later',
        item: '공책',
        amount: 1000,
        categoryId: 'school',
        date: '2026-04-25',
        createdAt: '2026-04-25T12:00:00.000Z',
      }),
      createEntry({
        id: 'entry-earlier',
        item: '버스',
        amount: 500,
        categoryId: 'transport',
        date: '2026-04-24',
        createdAt: '2026-04-24T09:00:00.000Z',
      }),
      createEntry({
        id: 'entry-same-day',
        item: '연필',
        amount: 700,
        categoryId: 'school',
        date: '2026-04-25',
        createdAt: '2026-04-25T08:00:00.000Z',
      }),
    ],
    [
      createSummary({ categoryId: 'school', label: '학용품', amount: 1700, percent: 77 }),
      createSummary({ categoryId: 'transport', label: '교통', amount: 500, percent: 23 }),
    ],
  )

  expect(csv).toBe(
    [
      '날짜,분류,내용,금액',
      '2026-04-24,교통,버스,500',
      '2026-04-25,학용품,연필,700',
      '2026-04-25,학용품,공책,1000',
      '',
      '분류,합계,비율',
      '학용품,1700,77%',
      '교통,500,23%',
    ].join('\n'),
  )
})

test('escapes CSV fields with commas, quotes, and line breaks', () => {
  const csv = createWeeklyCsv(
    [
      createEntry({
        item: '친구 선물, "작은 카드"\n포함',
        categoryId: 'gift',
        amount: 4500,
      }),
    ],
    [createSummary({ categoryId: 'gift', label: '선물', amount: 4500, percent: 100 })],
  )

  expect(csv).toContain('2026-04-26,선물,"친구 선물, ""작은 카드""\n포함",4500')
})

test('sanitizes text fields that could be interpreted as spreadsheet formulas', () => {
  const csv = createWeeklyCsv(
    [
      createEntry({
        item: '=HYPERLINK("https://example.com")',
        amount: 1200,
      }),
      createEntry({
        id: 'entry-with-leading-space',
        item: '   +SUM(1,1)',
        amount: 3400,
        createdAt: '2026-04-26T10:00:00.000Z',
      }),
    ],
    [],
  )

  expect(csv).toContain('2026-04-26,간식,"\'=HYPERLINK(""https://example.com"")",1200')
  expect(csv).toContain('2026-04-26,간식,"\'   +SUM(1,1)",3400')
})

test('creates a weekly CSV file name from the reference date key', () => {
  expect(createWeeklyFileName('2026-04-26')).toBe(
    'smart-allowance-week-2026-04-26.csv',
  )
})
