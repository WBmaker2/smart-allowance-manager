import { CATEGORIES } from '../data/categories'
import type { AllowanceEntry } from '../lib/allowance'

type ReceiptListProps = {
  entries: AllowanceEntry[]
  onDelete: (entry: AllowanceEntry) => void
}

const formatCurrency = (amount: number) => `${amount.toLocaleString('ko-KR')}원`

const formatDate = (dateKey: string) =>
  new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(new Date(`${dateKey}T00:00:00`))

const categoryLabelById = new Map(
  CATEGORIES.map((category) => [category.id, category.label]),
)

function ReceiptList({ entries, onDelete }: ReceiptListProps) {
  const sortedEntries = [...entries].sort((left, right) => {
    return (
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    )
  })

  return (
    <section className="panel receipt-panel" aria-labelledby="receipt-title">
      <div className="section-heading">
        <p className="eyebrow">영수증 모음</p>
        <h2 id="receipt-title">이번 주 기록</h2>
      </div>

      {sortedEntries.length === 0 ? (
        <p className="empty-text">아직 기록한 영수증이 없습니다.</p>
      ) : (
        <ul className="receipt-list">
          {sortedEntries.map((entry) => (
            <li className="receipt-item" key={entry.id}>
              <div>
                <time dateTime={entry.date}>{formatDate(entry.date)}</time>
                <strong>{entry.item}</strong>
                <span>{categoryLabelById.get(entry.categoryId) ?? '기타'}</span>
              </div>
              <div className="receipt-actions">
                <span className="receipt-amount">
                  {formatCurrency(entry.amount)}
                </span>
                <button type="button" onClick={() => onDelete(entry)}>
                  삭제
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default ReceiptList
