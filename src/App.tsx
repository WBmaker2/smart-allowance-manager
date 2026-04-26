import { useMemo, useState } from 'react'
import EntryForm, { type EntryFormValues } from './components/EntryForm'
import ReceiptList from './components/ReceiptList'
import SpendingPieChart from './components/SpendingPieChart'
import WeeklyInsight from './components/WeeklyInsight'
import {
  type AllowanceEntry,
  createAllowanceEntry,
  filterEntriesForWeek,
  getWeeklyInsight,
  summarizeByCategory,
} from './lib/allowance'
import { clearEntries, loadEntries, saveEntries } from './lib/storage'

const formatCurrency = (amount: number) => `${amount.toLocaleString('ko-KR')}원`

function App() {
  const [entries, setEntries] = useState<AllowanceEntry[]>(() => loadEntries())
  const [statusMessage, setStatusMessage] = useState('')

  const weeklyEntries = useMemo(
    () => filterEntriesForWeek(entries, new Date()),
    [entries],
  )
  const categorySummaries = useMemo(
    () => summarizeByCategory(weeklyEntries),
    [weeklyEntries],
  )
  const weeklyInsight = useMemo(
    () => getWeeklyInsight(weeklyEntries),
    [weeklyEntries],
  )

  const handleAddEntry = (values: EntryFormValues) => {
    const entry = createAllowanceEntry({
      item: values.item,
      amount: values.amount,
      categoryId: values.categoryId,
      date: values.date,
    })
    const nextEntries = [...entries, entry]

    setEntries(nextEntries)
    saveEntries(nextEntries)
    setStatusMessage(
      `${entry.item} ${formatCurrency(entry.amount)}을 기록했습니다`,
    )
  }

  const handleDeleteEntry = (entryToDelete: AllowanceEntry) => {
    const nextEntries = entries.filter((entry) => entry.id !== entryToDelete.id)

    setEntries(nextEntries)
    saveEntries(nextEntries)
    setStatusMessage(
      `${entryToDelete.item} ${formatCurrency(entryToDelete.amount)} 기록을 삭제했습니다`,
    )
  }

  const handleClearEntries = () => {
    setEntries([])
    clearEntries()
    setStatusMessage('모든 기록을 지웠습니다')
  }

  return (
    <main className="app-shell">
      <section className="hero-panel" aria-labelledby="app-title">
        <div>
          <p className="eyebrow">초등 경제 생활 기록</p>
          <h1 id="app-title">우리 반 꼬마 CEO: 스마트 용돈 기입장</h1>
          <p>
            오늘 쓴 돈을 기록하고 이번 주 소비 비율을 함께 살펴봅니다.
          </p>
        </div>
        <div className="hero-total" aria-label="이번 주 사용 금액">
          <span>이번 주 사용</span>
          <strong>{weeklyInsight.totalAmount.toLocaleString('ko-KR')}</strong>
          <span>원</span>
        </div>
      </section>

      <div className="app-grid">
        <section className="panel form-panel" aria-labelledby="form-title">
          <div className="section-heading">
            <p className="eyebrow">오늘의 선택</p>
            <h2 id="form-title">용돈 기록하기</h2>
          </div>
          <EntryForm onSubmit={handleAddEntry} />
        </section>

        <SpendingPieChart summaries={categorySummaries} />
        <WeeklyInsight insight={weeklyInsight} />
        <ReceiptList entries={weeklyEntries} onDelete={handleDeleteEntry} />
      </div>

      {entries.length > 0 ? (
        <button className="clear-button" type="button" onClick={handleClearEntries}>
          전체 기록 지우기
        </button>
      ) : null}

      <div className="sr-only" role="status" aria-live="polite">
        {statusMessage}
      </div>
    </main>
  )
}

export default App
