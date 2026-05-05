import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import {
  WEEKLY_GOAL_STORAGE_KEY,
  calculateWeeklyGoalStatus,
  clearWeeklyGoalAmount,
  loadWeeklyGoalAmount,
  normalizeWeeklyGoalAmount,
  saveWeeklyGoalAmount,
} from './weeklyGoal'

beforeEach(() => localStorage.clear())
afterEach(() => vi.restoreAllMocks())

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
  expect(calculateWeeklyGoalStatus(3000, 10000)).toEqual({
    goalAmount: 10000,
    spentAmount: 3000,
    remainingAmount: 7000,
    overAmount: 0,
    percentUsed: 30,
    isOverGoal: false,
    message: '목표까지 7,000원 남았어요.',
  })
})

test('calculates over-goal weekly status with capped percent', () => {
  expect(calculateWeeklyGoalStatus(12000, 10000)).toEqual({
    goalAmount: 10000,
    spentAmount: 12000,
    remainingAmount: 0,
    overAmount: 2000,
    percentUsed: 100,
    isOverGoal: true,
    message: '목표보다 2,000원 더 사용했어요.',
  })
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
  expect(localStorage.getItem(WEEKLY_GOAL_STORAGE_KEY)).toBe('12000')
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
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new DOMException('Blocked storage access', 'SecurityError')
  })

  expect(loadWeeklyGoalAmount()).toBeNull()
})

test('returns false when saving invalid weekly goal values', () => {
  expect(saveWeeklyGoalAmount(0)).toBe(false)
  expect(saveWeeklyGoalAmount(Number.POSITIVE_INFINITY)).toBe(false)
})

test('does not throw when localStorage setItem throws', () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('Storage quota exceeded', 'QuotaExceededError')
  })

  expect(saveWeeklyGoalAmount(12000)).toBe(false)
})

test('does not throw when localStorage removeItem throws', () => {
  vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
    throw new DOMException('Blocked storage access', 'SecurityError')
  })

  expect(clearWeeklyGoalAmount()).toBe(false)
})
