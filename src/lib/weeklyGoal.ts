export const WEEKLY_GOAL_STORAGE_KEY = 'smart-allowance-manager.weekly-goal'

export type WeeklyGoalStatus = {
  hasGoal: boolean
  goalAmount: number
  spentAmount: number
  remainingAmount: number
  overAmount: number
  percentUsed: number
  isOverGoal: boolean
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
  goalAmount: number | null,
): WeeklyGoalStatus {
  const normalizedGoalAmount =
    goalAmount === null ? null : normalizeWeeklyGoalAmount(goalAmount)
  const normalizedSpentAmount = normalizeNonNegativeInteger(spentAmount)

  if (normalizedGoalAmount === null) {
    return {
      hasGoal: false,
      goalAmount: 0,
      spentAmount: normalizedSpentAmount,
      remainingAmount: 0,
      overAmount: 0,
      percentUsed: 0,
      isOverGoal: false,
    }
  }

  const remainingAmount = Math.max(
    normalizedGoalAmount - normalizedSpentAmount,
    0,
  )
  const overAmount = Math.max(normalizedSpentAmount - normalizedGoalAmount, 0)
  const percentUsed = Math.min(
    100,
    Math.max(
      0,
      Math.floor((normalizedSpentAmount / normalizedGoalAmount) * 100),
    ),
  )
  const isOverGoal = normalizedSpentAmount > normalizedGoalAmount

  return {
    hasGoal: true,
    goalAmount: normalizedGoalAmount,
    spentAmount: normalizedSpentAmount,
    remainingAmount,
    overAmount,
    percentUsed,
    isOverGoal,
  }
}

export function getWeeklyGoalMessage(status: WeeklyGoalStatus): string {
  if (!status.hasGoal) {
    return '이번 주 목표 금액을 정해 보세요.'
  }

  if (status.isOverGoal) {
    return `목표보다 ${formatWon(status.overAmount)}원 더 사용했어요.`
  }

  return `목표까지 ${formatWon(status.remainingAmount)}원 남았어요.`
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
