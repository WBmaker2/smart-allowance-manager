import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import {
  WEEKLY_GOAL_STORAGE_KEY,
  calculateWeeklyGoalStatus,
  clearWeeklyGoalAmount,
  getWeeklyGoalMessage,
  loadWeeklyGoalAmount,
  normalizeWeeklyGoalAmount,
  saveWeeklyGoalAmount,
} from './weeklyGoal'

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

test('normalizes weekly goal amounts to positive integer won values', () => {
  expect(normalizeWeeklyGoalAmount('12000.9')).toBe(12000)
  expect(normalizeWeeklyGoalAmount(5000.8)).toBe(5000)
  expect(normalizeWeeklyGoalAmount(0)).toBeNull()
  expect(normalizeWeeklyGoalAmount(-1000)).toBeNull()
  expect(normalizeWeeklyGoalAmount(Number.NaN)).toBeNull()
  expect(normalizeWeeklyGoalAmount(Number.POSITIVE_INFINITY)).toBeNull()
  expect(normalizeWeeklyGoalAmount('not-a-number')).toBeNull()
})

test('calculates under-goal weekly status', () => {
  const status = calculateWeeklyGoalStatus(3000, 10000)

  expect(status).toEqual({
    hasGoal: true,
    goalAmount: 10000,
    spentAmount: 3000,
    remainingAmount: 7000,
    overAmount: 0,
    percentUsed: 30,
    isOverGoal: false,
  })
  expect(getWeeklyGoalMessage(status)).toBe('목표까지 7,000원 남았어요.')
})

test('calculates over-goal weekly status with capped percent', () => {
  const status = calculateWeeklyGoalStatus(12000, 10000)

  expect(status).toEqual({
    hasGoal: true,
    goalAmount: 10000,
    spentAmount: 12000,
    remainingAmount: 0,
    overAmount: 2000,
    percentUsed: 100,
    isOverGoal: true,
  })
  expect(getWeeklyGoalMessage(status)).toBe('목표보다 2,000원 더 사용했어요.')
})

test('returns an empty-goal status when goal amount is missing or invalid', () => {
  expect(calculateWeeklyGoalStatus(3000, null)).toEqual({
    hasGoal: false,
    goalAmount: 0,
    spentAmount: 3000,
    remainingAmount: 0,
    overAmount: 0,
    percentUsed: 0,
    isOverGoal: false,
  })

  expect(calculateWeeklyGoalStatus(3000, Number.NaN)).toEqual({
    hasGoal: false,
    goalAmount: 0,
    spentAmount: 3000,
    remainingAmount: 0,
    overAmount: 0,
    percentUsed: 0,
    isOverGoal: false,
  })

  expect(getWeeklyGoalMessage(calculateWeeklyGoalStatus(3000, null))).toBe(
    '이번 주 목표 금액을 정해 보세요.',
  )
})

test('normalizes spent amount before calculating status', () => {
  expect(calculateWeeklyGoalStatus(-1000, 10000)).toEqual(
    expect.objectContaining({
      spentAmount: 0,
      remainingAmount: 10000,
      percentUsed: 0,
    }),
  )

  expect(calculateWeeklyGoalStatus(3333.9, 10000)).toEqual(
    expect.objectContaining({
      spentAmount: 3333,
      percentUsed: 33,
    }),
  )
})

test('saves, loads, and clears weekly goal amount', () => {
  expect(saveWeeklyGoalAmount(12000.9)).toBe(true)
  expect(loadWeeklyGoalAmount()).toBe(12000)

  expect(clearWeeklyGoalAmount()).toBe(true)
  expect(loadWeeklyGoalAmount()).toBeNull()
})

test('ignores broken stored weekly goal values', () => {
  localStorage.setItem(WEEKLY_GOAL_STORAGE_KEY, '0')
  expect(loadWeeklyGoalAmount()).toBeNull()

  localStorage.setItem(WEEKLY_GOAL_STORAGE_KEY, '-1000')
  expect(loadWeeklyGoalAmount()).toBeNull()

  localStorage.setItem(WEEKLY_GOAL_STORAGE_KEY, 'Infinity')
  expect(loadWeeklyGoalAmount()).toBeNull()

  localStorage.setItem(WEEKLY_GOAL_STORAGE_KEY, 'broken')
  expect(loadWeeklyGoalAmount()).toBeNull()
})

test('does not throw when localStorage getItem throws', () => {
  vi.mocked(localStorage.getItem).mockImplementationOnce(() => {
    throw new DOMException('Blocked storage access', 'SecurityError')
  })

  expect(loadWeeklyGoalAmount()).toBeNull()
})

test('returns false when saving invalid weekly goal values', () => {
  expect(saveWeeklyGoalAmount(0)).toBe(false)
  expect(saveWeeklyGoalAmount(Number.POSITIVE_INFINITY)).toBe(false)
})

test('does not throw when localStorage setItem throws', () => {
  vi.mocked(localStorage.setItem).mockImplementationOnce(() => {
    throw new DOMException('Storage quota exceeded', 'QuotaExceededError')
  })

  expect(saveWeeklyGoalAmount(12000)).toBe(false)
})

test('does not throw when localStorage removeItem throws', () => {
  vi.mocked(localStorage.removeItem).mockImplementationOnce(() => {
    throw new DOMException('Blocked storage access', 'SecurityError')
  })

  expect(clearWeeklyGoalAmount()).toBe(false)
})
