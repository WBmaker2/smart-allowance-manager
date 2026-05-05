import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import {
  WEEKLY_INCOME_STORAGE_KEY,
  calculateWeeklyBalanceStatus,
  clearWeeklyIncomeAmount,
  getWeeklyBalanceMessage,
  loadWeeklyIncomeAmount,
  normalizeWeeklyIncomeAmount,
  saveWeeklyIncomeAmount,
} from './weeklyBalance'

const storedValues = new Map<string, string>()

beforeEach(() => {
  storedValues.clear()

  vi.stubGlobal('localStorage', {
    getItem: vi.fn((key: string) => storedValues.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => {
      storedValues.set(key, String(value))
    }),
    removeItem: vi.fn((key: string) => {
      storedValues.delete(key)
    }),
    clear: vi.fn(() => {
      storedValues.clear()
    }),
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

test('normalizes weekly income amounts to positive integer won values', () => {
  expect(normalizeWeeklyIncomeAmount('20000.9')).toBe(20000)
  expect(normalizeWeeklyIncomeAmount(5000.8)).toBe(5000)
  expect(normalizeWeeklyIncomeAmount(0)).toBeNull()
  expect(normalizeWeeklyIncomeAmount(-1000)).toBeNull()
  expect(normalizeWeeklyIncomeAmount(Number.NaN)).toBeNull()
  expect(normalizeWeeklyIncomeAmount(Number.POSITIVE_INFINITY)).toBeNull()
  expect(normalizeWeeklyIncomeAmount('not-a-number')).toBeNull()
})

test('calculates a positive weekly balance status', () => {
  const status = calculateWeeklyBalanceStatus(7000, 20000)

  expect(status).toEqual({
    hasIncome: true,
    incomeAmount: 20000,
    spentAmount: 7000,
    balanceAmount: 13000,
    shortageAmount: 0,
    percentSpent: 35,
    isShort: false,
  })
  expect(getWeeklyBalanceMessage(status)).toBe(
    '이번 주 남은 돈은 13,000원이에요.',
  )
})

test('calculates a shortage weekly balance status with capped percent', () => {
  const status = calculateWeeklyBalanceStatus(24000, 20000)

  expect(status).toEqual({
    hasIncome: true,
    incomeAmount: 20000,
    spentAmount: 24000,
    balanceAmount: 0,
    shortageAmount: 4000,
    percentSpent: 100,
    isShort: true,
  })
  expect(getWeeklyBalanceMessage(status)).toBe(
    '받은 돈보다 4,000원 더 사용했어요.',
  )
})

test('returns an empty-income status when income amount is missing or invalid', () => {
  expect(calculateWeeklyBalanceStatus(3000, null)).toEqual({
    hasIncome: false,
    incomeAmount: 0,
    spentAmount: 3000,
    balanceAmount: 0,
    shortageAmount: 0,
    percentSpent: 0,
    isShort: false,
  })

  expect(calculateWeeklyBalanceStatus(3000, Number.NaN)).toEqual({
    hasIncome: false,
    incomeAmount: 0,
    spentAmount: 3000,
    balanceAmount: 0,
    shortageAmount: 0,
    percentSpent: 0,
    isShort: false,
  })

  expect(getWeeklyBalanceMessage(calculateWeeklyBalanceStatus(3000, null))).toBe(
    '이번 주 받은 돈을 입력하면 남은 돈을 볼 수 있어요.',
  )
})

test('saves, loads, and clears weekly income amount', () => {
  expect(saveWeeklyIncomeAmount(15000.9)).toBe(true)
  expect(loadWeeklyIncomeAmount()).toBe(15000)

  expect(clearWeeklyIncomeAmount()).toBe(true)
  expect(loadWeeklyIncomeAmount()).toBeNull()
})

test('ignores broken stored weekly income values', () => {
  localStorage.setItem(WEEKLY_INCOME_STORAGE_KEY, '0')
  expect(loadWeeklyIncomeAmount()).toBeNull()

  localStorage.setItem(WEEKLY_INCOME_STORAGE_KEY, '-1000')
  expect(loadWeeklyIncomeAmount()).toBeNull()

  localStorage.setItem(WEEKLY_INCOME_STORAGE_KEY, 'Infinity')
  expect(loadWeeklyIncomeAmount()).toBeNull()

  localStorage.setItem(WEEKLY_INCOME_STORAGE_KEY, 'broken')
  expect(loadWeeklyIncomeAmount()).toBeNull()
})

test('does not throw when weekly income storage access fails', () => {
  vi.mocked(localStorage.getItem).mockImplementationOnce(() => {
    throw new DOMException('Blocked storage access', 'SecurityError')
  })
  expect(loadWeeklyIncomeAmount()).toBeNull()

  vi.mocked(localStorage.setItem).mockImplementationOnce(() => {
    throw new DOMException('Storage quota exceeded', 'QuotaExceededError')
  })
  expect(saveWeeklyIncomeAmount(15000)).toBe(false)

  vi.mocked(localStorage.removeItem).mockImplementationOnce(() => {
    throw new DOMException('Blocked storage access', 'SecurityError')
  })
  expect(clearWeeklyIncomeAmount()).toBe(false)
})
