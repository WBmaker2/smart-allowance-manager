export const WEEKLY_INCOME_STORAGE_KEY = 'smart-allowance-manager.weekly-income'

export type WeeklyBalanceStatus = {
  hasIncome: boolean
  incomeAmount: number
  spentAmount: number
  balanceAmount: number
  shortageAmount: number
  percentSpent: number
  isShort: boolean
}

const formatWon = (amount: number) => amount.toLocaleString('ko-KR')

const normalizeNonNegativeInteger = (amount: number) => {
  if (!Number.isFinite(amount) || amount <= 0) {
    return 0
  }

  return Math.floor(amount)
}

export function normalizeWeeklyIncomeAmount(
  amount: number | string,
): number | null {
  const numericAmount =
    typeof amount === 'string' ? Number.parseFloat(amount.trim()) : amount

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    return null
  }

  return Math.floor(numericAmount)
}

export function calculateWeeklyBalanceStatus(
  spentAmount: number,
  incomeAmount: number | null,
): WeeklyBalanceStatus {
  const normalizedIncomeAmount =
    incomeAmount === null ? null : normalizeWeeklyIncomeAmount(incomeAmount)
  const normalizedSpentAmount = normalizeNonNegativeInteger(spentAmount)

  if (normalizedIncomeAmount === null) {
    return {
      hasIncome: false,
      incomeAmount: 0,
      spentAmount: normalizedSpentAmount,
      balanceAmount: 0,
      shortageAmount: 0,
      percentSpent: 0,
      isShort: false,
    }
  }

  const balanceAmount = Math.max(normalizedIncomeAmount - normalizedSpentAmount, 0)
  const shortageAmount = Math.max(normalizedSpentAmount - normalizedIncomeAmount, 0)
  const percentSpent = Math.min(
    100,
    Math.max(
      0,
      Math.floor((normalizedSpentAmount / normalizedIncomeAmount) * 100),
    ),
  )

  return {
    hasIncome: true,
    incomeAmount: normalizedIncomeAmount,
    spentAmount: normalizedSpentAmount,
    balanceAmount,
    shortageAmount,
    percentSpent,
    isShort: shortageAmount > 0,
  }
}

export function getWeeklyBalanceMessage(status: WeeklyBalanceStatus): string {
  if (!status.hasIncome) {
    return '이번 주 받은 돈을 입력하면 남은 돈을 볼 수 있어요.'
  }

  if (status.isShort) {
    return `받은 돈보다 ${formatWon(status.shortageAmount)}원 더 사용했어요.`
  }

  return `이번 주 남은 돈은 ${formatWon(status.balanceAmount)}원이에요.`
}

export function loadWeeklyIncomeAmount(): number | null {
  let storedIncomeAmount: string | null

  try {
    storedIncomeAmount = localStorage.getItem(WEEKLY_INCOME_STORAGE_KEY)
  } catch {
    return null
  }

  if (storedIncomeAmount === null) {
    return null
  }

  return normalizeWeeklyIncomeAmount(storedIncomeAmount)
}

export function saveWeeklyIncomeAmount(incomeAmount: number): boolean {
  const normalizedIncomeAmount = normalizeWeeklyIncomeAmount(incomeAmount)

  if (normalizedIncomeAmount === null) {
    return false
  }

  try {
    localStorage.setItem(WEEKLY_INCOME_STORAGE_KEY, String(normalizedIncomeAmount))
    return true
  } catch {
    return false
  }
}

export function clearWeeklyIncomeAmount(): boolean {
  try {
    localStorage.removeItem(WEEKLY_INCOME_STORAGE_KEY)
    return true
  } catch {
    return false
  }
}
