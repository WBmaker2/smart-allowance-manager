import { CATEGORIES, type CategoryId } from '../data/categories'

export type AllowanceEntry = {
  id: string
  item: string
  amount: number
  categoryId: CategoryId
  date: string
  createdAt: string
}

export type AllowanceEntryInput = {
  item: string
  amount: number | string
  categoryId: string
  date: string | Date
  id?: string
  createdAt?: string
}

export type CategorySummary = {
  categoryId: CategoryId
  label: string
  color: string
  amount: number
  percent: number
}

export type WeeklyInsight = {
  totalAmount: number
  topCategoryId: CategoryId | null
  topCategoryLabel: string
  topCategoryPercent: number
  message: string
}

const VALID_CATEGORY_IDS = new Set<string>(CATEGORIES.map((category) => category.id))

const toDateKey = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const parseDateKey = (value: string | Date) => {
  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return toDateKey(value)
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed)

    if (dateOnlyMatch) {
      const [, year, month, day] = dateOnlyMatch
      const parsed = new Date(Number(year), Number(month) - 1, Number(day))

      if (
        parsed.getFullYear() === Number(year) &&
        parsed.getMonth() === Number(month) - 1 &&
        parsed.getDate() === Number(day)
      ) {
        return trimmed
      }
    }

    const parsed = new Date(trimmed)

    if (Number.isFinite(parsed.getTime())) {
      return toDateKey(parsed)
    }
  }

  return toDateKey(new Date())
}

const parseDateKeyAsLocalDate = (dateKey: string) => {
  const [year, month, day] = dateKey.split('-').map(Number)

  return new Date(year, month - 1, day)
}

const normalizeAmount = (amount: number | string) => {
  const numericAmount =
    typeof amount === 'string' ? Number.parseFloat(amount.trim()) : amount

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    return 0
  }

  return Math.floor(numericAmount)
}

const normalizeCategoryId = (categoryId: string): CategoryId => {
  return VALID_CATEGORY_IDS.has(categoryId) ? (categoryId as CategoryId) : 'other'
}

const createEntryId = (entry: Omit<AllowanceEntry, 'id'>) => {
  const source = [
    entry.item,
    entry.amount,
    entry.categoryId,
    entry.date,
    entry.createdAt,
  ].join('|')

  let hash = 0

  for (let index = 0; index < source.length; index += 1) {
    hash = (hash * 31 + source.charCodeAt(index)) >>> 0
  }

  return `allowance-${hash.toString(36)}`
}

const getWeekRange = (referenceDate: Date) => {
  const start = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
  )
  const day = start.getDay()
  const daysSinceMonday = day === 0 ? 6 : day - 1

  start.setDate(start.getDate() - daysSinceMonday)
  start.setHours(0, 0, 0, 0)

  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)

  return { start, end }
}

const allocateRoundedPercents = (amounts: number[], totalAmount: number) => {
  if (totalAmount <= 0) {
    return amounts.map(() => 0)
  }

  const shares = amounts.map((amount, index) => {
    const rawPercent = (amount / totalAmount) * 100

    return {
      index,
      floor: Math.floor(rawPercent),
      remainder: rawPercent - Math.floor(rawPercent),
    }
  })

  const percents = shares.map((share) => share.floor)
  let remaining = 100 - percents.reduce((total, percent) => total + percent, 0)

  const order = [...shares].sort((left, right) => {
    if (right.remainder !== left.remainder) {
      return right.remainder - left.remainder
    }

    return left.index - right.index
  })

  for (const share of order) {
    if (remaining <= 0) {
      break
    }

    percents[share.index] += 1
    remaining -= 1
  }

  return percents
}

export const createAllowanceEntry = (
  input: AllowanceEntryInput,
): AllowanceEntry => {
  const createdAt = input.createdAt ?? new Date().toISOString()
  const entryWithoutId = {
    item: input.item.trim(),
    amount: normalizeAmount(input.amount),
    categoryId: normalizeCategoryId(input.categoryId),
    date: parseDateKey(input.date),
    createdAt,
  }

  return {
    ...entryWithoutId,
    id: input.id ?? createEntryId(entryWithoutId),
  }
}

export const filterEntriesForWeek = (
  entries: AllowanceEntry[],
  referenceDate: Date,
) => {
  const { start, end } = getWeekRange(referenceDate)

  return entries.filter((entry) => {
    const entryDate = parseDateKeyAsLocalDate(parseDateKey(entry.date))

    return entryDate >= start && entryDate <= end
  })
}

export const summarizeByCategory = (
  entries: AllowanceEntry[],
): CategorySummary[] => {
  const amountByCategory = new Map<CategoryId, number>()

  for (const entry of entries) {
    const categoryId = normalizeCategoryId(entry.categoryId)

    amountByCategory.set(
      categoryId,
      (amountByCategory.get(categoryId) ?? 0) + normalizeAmount(entry.amount),
    )
  }

  const summaries = CATEGORIES.map((category) => ({
    categoryId: category.id,
    label: category.label,
    color: category.color,
    amount: amountByCategory.get(category.id) ?? 0,
    percent: 0,
  })).filter((category) => category.amount > 0)

  const totalAmount = summaries.reduce((total, category) => total + category.amount, 0)
  const percents = allocateRoundedPercents(
    summaries.map((category) => category.amount),
    totalAmount,
  )

  return summaries.map((category, index) => ({
    ...category,
    percent: percents[index],
  }))
}

export const getWeeklyInsight = (entries: AllowanceEntry[]): WeeklyInsight => {
  const summary = summarizeByCategory(entries)
  const totalAmount = summary.reduce((total, category) => total + category.amount, 0)
  const topCategory = summary[0]

  if (!topCategory || totalAmount <= 0) {
    return {
      totalAmount: 0,
      topCategoryId: null,
      topCategoryLabel: '',
      topCategoryPercent: 0,
      message: '이번 주 용돈 기록을 추가하면 소비 습관을 함께 돌아볼 수 있어요.',
    }
  }

  const strongestCategory = summary.reduce((top, category) => {
    if (category.amount > top.amount) {
      return category
    }

    return top
  }, topCategory)

  const message =
    strongestCategory.percent >= 50
      ? `이번 주에는 ${strongestCategory.label}에 ${strongestCategory.percent}%를 사용했어요. 이 선택이 꼭 필요했는지 한 번 떠올려 보세요.`
      : `이번 주 소비가 여러 항목에 나뉘어 있어요. 가장 큰 항목은 ${strongestCategory.label} ${strongestCategory.percent}%입니다.`

  return {
    totalAmount,
    topCategoryId: strongestCategory.categoryId,
    topCategoryLabel: strongestCategory.label,
    topCategoryPercent: strongestCategory.percent,
    message,
  }
}
