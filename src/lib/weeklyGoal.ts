export const WEEKLY_GOAL_STORAGE_KEY = 'smart-allowance-manager.weekly-goal'

export type WeeklyGoalStatus = {
  goalAmount: number
  spentAmount: number
  remainingAmount: number
  overAmount: number
  percentUsed: number
  isOverGoal: boolean
  message: string
}

const formatWon = (amount: number) => amount.toLocaleString('ko-KR')

const normalizeNonNegativeInteger = (amount: number) => {
  if (!Number.isFinite(amount) || amount <= 0) {
    return 0
  }

  return Math.floor(amount)
}

export function normalizeWeeklyGoalAmount(
  amount: number | string,
): number | null {
  const numericAmount =
    typeof amount === 'string' ? Number.parseFloat(amount.trim()) : amount

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    return null
  }

  return Math.floor(numericAmount)
}

export function calculateWeeklyGoalStatus(
  spentAmount: number,
  goalAmount: number,
): WeeklyGoalStatus {
  const normalizedGoalAmount = normalizeWeeklyGoalAmount(goalAmount) ?? 0
  const normalizedSpentAmount = normalizeNonNegativeInteger(spentAmount)
  const remainingAmount = Math.max(
    normalizedGoalAmount - normalizedSpentAmount,
    0,
  )
  const overAmount = Math.max(normalizedSpentAmount - normalizedGoalAmount, 0)
  const percentUsed =
    normalizedGoalAmount > 0
      ? Math.min(
          100,
          Math.max(
            0,
            Math.floor((normalizedSpentAmount / normalizedGoalAmount) * 100),
          ),
        )
      : 0
  const isOverGoal = normalizedGoalAmount > 0 && normalizedSpentAmount > normalizedGoalAmount

  return {
    goalAmount: normalizedGoalAmount,
    spentAmount: normalizedSpentAmount,
    remainingAmount,
    overAmount,
    percentUsed,
    isOverGoal,
    message: isOverGoal
      ? `목표보다 ${formatWon(overAmount)}원 더 사용했어요.`
      : `목표까지 ${formatWon(remainingAmount)}원 남았어요.`,
  }
}

export function loadWeeklyGoalAmount(): number | null {
  let storedGoalAmount: string | null

  try {
    storedGoalAmount = localStorage.getItem(WEEKLY_GOAL_STORAGE_KEY)
  } catch {
    return null
  }

  if (storedGoalAmount === null) {
    return null
  }

  return normalizeWeeklyGoalAmount(storedGoalAmount)
}

export function saveWeeklyGoalAmount(goalAmount: number): boolean {
  const normalizedGoalAmount = normalizeWeeklyGoalAmount(goalAmount)

  if (normalizedGoalAmount === null) {
    return false
  }

  try {
    localStorage.setItem(WEEKLY_GOAL_STORAGE_KEY, String(normalizedGoalAmount))
    return true
  } catch {
    return false
  }
}

export function clearWeeklyGoalAmount(): boolean {
  try {
    localStorage.removeItem(WEEKLY_GOAL_STORAGE_KEY)
    return true
  } catch {
    return false
  }
}
