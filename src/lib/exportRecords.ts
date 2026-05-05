import { CATEGORIES } from '../data/categories'
import type { AllowanceEntry, CategorySummary } from './allowance'

const categoryLabelById = new Map(
  CATEGORIES.map((category) => [category.id, category.label]),
)

const escapeCsvField = (value: string | number) => {
  const text = String(value)

  if (!/[",\n\r]/.test(text)) {
    return text
  }

  return `"${text.replaceAll('"', '""')}"`
}

export const createWeeklyCsv = (
  entries: AllowanceEntry[],
  summaries: CategorySummary[],
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

  return [
    '날짜,분류,내용,금액',
    ...entryRows,
    '',
    '분류,합계,비율',
    ...summaryRows,
  ].join('\n')
}

export const createWeeklyFileName = (dateKey: string) =>
  `smart-allowance-week-${dateKey}.csv`
