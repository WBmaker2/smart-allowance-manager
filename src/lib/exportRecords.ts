import { CATEGORIES } from '../data/categories'
import type { AllowanceEntry, CategorySummary } from './allowance'
import type { WeeklyBalanceStatus } from './weeklyBalance'

const categoryLabelById = new Map(
  CATEGORIES.map((category) => [category.id, category.label]),
)

const sanitizeCsvTextField = (value: string) => {
  if (/^\s*[=+\-@]/.test(value)) {
    return `'${value}`
  }

  return value
}

const escapeCsvField = (value: string | number) => {
  const text = typeof value === 'number' ? String(value) : sanitizeCsvTextField(value)

  if (!/[",\n\r]/.test(text)) {
    return text
  }

  return `"${text.replace(/"/g, '""')}"`
}

export const createWeeklyCsv = (
  entries: AllowanceEntry[],
  summaries: CategorySummary[],
  balanceStatus?: WeeklyBalanceStatus,
) => {
  const sortedEntries = [...entries].sort((left, right) => {
    const dateComparison = left.date.localeCompare(right.date)

    if (dateComparison !== 0) {
      return dateComparison
    }

    return left.createdAt.localeCompare(right.createdAt)
  })

  const entryRows = sortedEntries.map((entry) =>
    [
      entry.date,
      categoryLabelById.get(entry.categoryId) ?? '기타',
      entry.item,
      entry.amount,
    ]
      .map(escapeCsvField)
      .join(','),
  )

  const summaryRows = summaries.map((summary) =>
    [summary.label, summary.amount, `${summary.percent}%`]
      .map(escapeCsvField)
      .join(','),
  )
  const totalSpentAmount =
    balanceStatus?.spentAmount ??
    summaries.reduce((total, summary) => total + summary.amount, 0)
  const balanceRows =
    balanceStatus && balanceStatus.hasIncome
      ? [
          [sanitizeCsvTextField('받은 돈'), balanceStatus.incomeAmount].join(','),
          [sanitizeCsvTextField('사용한 돈'), totalSpentAmount].join(','),
          [
            sanitizeCsvTextField(balanceStatus.isShort ? '부족한 돈' : '남은 돈'),
            balanceStatus.isShort
              ? balanceStatus.shortageAmount
              : balanceStatus.balanceAmount,
          ].join(','),
        ]
      : []

  return [
    '날짜,분류,내용,금액',
    ...entryRows,
    '',
    '분류,합계,비율',
    ...summaryRows,
    ...(balanceRows.length > 0
      ? ['', '항목,금액', ...balanceRows]
      : []),
  ].join('\n')
}

export const createWeeklyFileName = (dateKey: string) =>
  `smart-allowance-week-${dateKey}.csv`
