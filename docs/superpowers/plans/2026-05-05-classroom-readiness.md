# Classroom Readiness Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 이미 배포된 스마트 용돈 기입장을 교실에서 바로 안내, 사용, 회수할 수 있도록 수업 문서, 주간 목표 금액, 주간 기록 내보내기 기능을 추가한다.

**Architecture:** 현재 Vite + React + TypeScript 단일 페이지 구조를 유지한다. 용돈 기록 로직은 기존 `allowance.ts`를 유지하고, 목표 금액과 내보내기 로직은 작은 순수 함수 모듈로 분리한 뒤 App에서 상태와 이벤트를 연결한다. UI는 기존 패널 레이아웃과 한국어 접근성 문구를 따르며 localStorage 기반 개인 디바이스 저장 범위를 넘지 않는다.

**Tech Stack:** Vite, React, TypeScript, Chart.js, react-chartjs-2, Vitest, Testing Library, localStorage, plain CSS.

---

## File Structure

- Create: `README.md` - 교사용 수업 활용 안내, 실행/배포 URL, 성취기준, 활동 흐름.
- Create: `src/lib/weeklyGoal.ts` - 주간 목표 금액 정규화, 진행률 계산, localStorage 저장/삭제.
- Create: `src/lib/weeklyGoal.test.ts` - 목표 금액 계산과 저장 안정성 테스트.
- Create: `src/components/WeeklyGoalCard.tsx` - 이번 주 목표 금액 입력, 남은 금액/초과 금액, 진행 막대 UI.
- Create: `src/lib/exportRecords.ts` - 주간 기록 CSV 생성, 파일명 생성.
- Create: `src/lib/exportRecords.test.ts` - CSV escaping, 빈 기록, 날짜순 출력 테스트.
- Create: `src/components/WeeklyReportActions.tsx` - CSV 다운로드와 인쇄 버튼 UI.
- Modify: `src/App.tsx` - 목표 금액 상태, 목표 카드, 내보내기 액션 연결.
- Modify: `src/App.css` - 목표 카드, 진행 막대, 액션 버튼, print 스타일.
- Modify: `src/App.test.tsx` - 목표 금액 저장/복원, CSV 다운로드, 인쇄 액션 사용자 흐름 테스트.

---

### Task 1: Add Classroom Usage Documentation

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write the classroom README**

Create `README.md` with this content:

```markdown
# 우리 반 꼬마 CEO: 스마트 용돈 기입장

5~6학년 학생이 자신의 용돈 사용 내역을 기록하고, 이번 주 소비 비율을 원그래프로 확인하며 소비 습관을 돌아보는 금융 교육 웹앱입니다.

## 바로 사용하기

- 배포 URL: https://wbmaker2.github.io/smart-allowance-manager/
- GitHub 저장소: https://github.com/WBmaker2/smart-allowance-manager

## 수업 맥락

- 대상: 초등학교 5~6학년
- 과목: 실과 / 수학 융합
- 성취기준:
  - [6실02-02] 용돈 관리의 필요성을 알고 자신의 용돈 사용을 평가한다.
  - [6수04-03] 주어진 자료를 띠그래프와 원그래프로 나타낼 수 있다.

## 수업 흐름 예시

1. 학생이 이번 주에 사용한 돈을 날짜, 항목, 금액, 분류로 입력합니다.
2. 입력한 기록이 영수증처럼 쌓이는지 확인합니다.
3. 카테고리별 소비 비율 원그래프를 보고 가장 큰 비율을 찾습니다.
4. 주간 생각 정리 문장을 읽고 자신의 소비 선택을 돌아봅니다.
5. 다음 주에는 어떤 소비를 줄이거나 계획할지 한 문장으로 적습니다.

## 교사 안내

- 데이터는 학생 기기의 브라우저 localStorage에 저장됩니다.
- 서버나 계정 로그인을 사용하지 않으므로 학생별 기록은 서로 공유되지 않습니다.
- 공용 기기에서는 수업 후 `전체 기록 지우기`를 눌러 개인 기록을 삭제하도록 안내합니다.
- 금액은 실제 용돈이 아니어도 가상의 예산 활동으로 사용할 수 있습니다.

## 로컬 실행

```bash
npm install
npm run dev
```

## 검증

```bash
npm test
npm run build
```
```

- [ ] **Step 2: Verify the README**

Run:

```bash
test -s README.md
rg -n "성취기준|localStorage|https://wbmaker2.github.io/smart-allowance-manager/" README.md
```

Expected: `README.md` exists and the command prints the achievement standard, storage note, and deployed URL lines.

- [ ] **Step 3: Commit**

Run:

```bash
git add README.md
git commit -m "docs: add classroom usage guide"
```

Expected: documentation commit is created.

---

### Task 2: Add Weekly Goal Domain and Persistence

**Files:**
- Create: `src/lib/weeklyGoal.ts`
- Create: `src/lib/weeklyGoal.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/lib/weeklyGoal.test.ts`:

```ts
import { afterEach, expect, test, vi } from 'vitest'
import {
  WEEKLY_GOAL_STORAGE_KEY,
  calculateWeeklyGoalStatus,
  clearWeeklyGoalAmount,
  loadWeeklyGoalAmount,
  normalizeWeeklyGoalAmount,
  saveWeeklyGoalAmount,
} from './weeklyGoal'

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

test('normalizes weekly goal amount to a positive integer won value', () => {
  expect(normalizeWeeklyGoalAmount('12000.9')).toBe(12000)
  expect(normalizeWeeklyGoalAmount(' 0 ')).toBeNull()
  expect(normalizeWeeklyGoalAmount('abc')).toBeNull()
})

test('calculates remaining amount and percent used', () => {
  const status = calculateWeeklyGoalStatus(3000, 10000)

  expect(status).toEqual({
    goalAmount: 10000,
    spentAmount: 3000,
    remainingAmount: 7000,
    percentUsed: 30,
    isOverGoal: false,
    message: '목표까지 7,000원 남았어요.',
  })
})

test('calculates over-goal status', () => {
  const status = calculateWeeklyGoalStatus(12000, 10000)

  expect(status.remainingAmount).toBe(0)
  expect(status.percentUsed).toBe(100)
  expect(status.isOverGoal).toBe(true)
  expect(status.message).toBe('목표보다 2,000원 더 사용했어요.')
})

test('saves, loads, and clears weekly goal amount safely', () => {
  expect(saveWeeklyGoalAmount(15000)).toBe(true)
  expect(localStorage.getItem(WEEKLY_GOAL_STORAGE_KEY)).toBe('15000')
  expect(loadWeeklyGoalAmount()).toBe(15000)

  expect(clearWeeklyGoalAmount()).toBe(true)
  expect(loadWeeklyGoalAmount()).toBeNull()
})

test('ignores broken stored weekly goal values', () => {
  localStorage.setItem(WEEKLY_GOAL_STORAGE_KEY, '-100')

  expect(loadWeeklyGoalAmount()).toBeNull()
})

test('returns false when weekly goal storage writes fail', () => {
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('Storage quota exceeded', 'QuotaExceededError')
  })

  expect(saveWeeklyGoalAmount(10000)).toBe(false)
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- src/lib/weeklyGoal.test.ts
```

Expected: FAIL because `src/lib/weeklyGoal.ts` does not exist.

- [ ] **Step 3: Implement weekly goal logic**

Create `src/lib/weeklyGoal.ts`:

```ts
export const WEEKLY_GOAL_STORAGE_KEY = 'smart-allowance-manager.weekly-goal'

export type WeeklyGoalStatus = {
  goalAmount: number
  spentAmount: number
  remainingAmount: number
  percentUsed: number
  isOverGoal: boolean
  message: string
}

const formatCurrency = (amount: number) => `${amount.toLocaleString('ko-KR')}원`

export const normalizeWeeklyGoalAmount = (amount: number | string) => {
  const numericAmount =
    typeof amount === 'string' ? Number.parseFloat(amount.trim()) : amount

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    return null
  }

  return Math.floor(numericAmount)
}

export const calculateWeeklyGoalStatus = (
  spentAmount: number,
  goalAmount: number,
): WeeklyGoalStatus => {
  const normalizedGoal = normalizeWeeklyGoalAmount(goalAmount) ?? 0
  const normalizedSpent = Math.max(Math.floor(spentAmount), 0)
  const overAmount = Math.max(normalizedSpent - normalizedGoal, 0)
  const remainingAmount = Math.max(normalizedGoal - normalizedSpent, 0)
  const percentUsed =
    normalizedGoal > 0
      ? Math.min(Math.round((normalizedSpent / normalizedGoal) * 100), 100)
      : 0

  return {
    goalAmount: normalizedGoal,
    spentAmount: normalizedSpent,
    remainingAmount,
    percentUsed,
    isOverGoal: overAmount > 0,
    message:
      overAmount > 0
        ? `목표보다 ${formatCurrency(overAmount)} 더 사용했어요.`
        : `목표까지 ${formatCurrency(remainingAmount)} 남았어요.`,
  }
}

export function loadWeeklyGoalAmount() {
  let storedGoal: string | null

  try {
    storedGoal = localStorage.getItem(WEEKLY_GOAL_STORAGE_KEY)
  } catch {
    return null
  }

  if (storedGoal === null) {
    return null
  }

  return normalizeWeeklyGoalAmount(storedGoal)
}

export function saveWeeklyGoalAmount(goalAmount: number): boolean {
  const normalizedGoal = normalizeWeeklyGoalAmount(goalAmount)

  if (normalizedGoal === null) {
    return false
  }

  try {
    localStorage.setItem(WEEKLY_GOAL_STORAGE_KEY, String(normalizedGoal))
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
```

- [ ] **Step 4: Run tests and commit**

Run:

```bash
npm test -- src/lib/weeklyGoal.test.ts
git add src/lib/weeklyGoal.ts src/lib/weeklyGoal.test.ts
git commit -m "feat: add weekly goal logic"
```

Expected: weekly goal tests pass and commit is created.

---

### Task 3: Add Weekly Goal UI

**Files:**
- Create: `src/components/WeeklyGoalCard.tsx`
- Modify: `src/App.tsx`
- Modify: `src/App.css`
- Modify: `src/App.test.tsx`

- [ ] **Step 1: Write failing user-flow tests**

Append these tests to `src/App.test.tsx`:

```ts
test('sets and persists a weekly goal amount', async () => {
  const user = setupUser()
  const { unmount } = render(<App />)

  await user.type(screen.getByLabelText('이번 주 목표 금액'), '10000')
  await user.click(screen.getByRole('button', { name: '목표 저장' }))

  expect(screen.getByText('목표까지 10,000원 남았어요.')).toBeInTheDocument()
  expect(screen.getByRole('status')).toHaveTextContent(
    '이번 주 목표 금액 10,000원을 저장했습니다',
  )

  unmount()
  render(<App />)

  expect(screen.getByText('목표까지 10,000원 남았어요.')).toBeInTheDocument()
})

test('updates the weekly goal progress after adding receipts', async () => {
  const user = setupUser()
  render(<App />)

  await user.type(screen.getByLabelText('이번 주 목표 금액'), '5000')
  await user.click(screen.getByRole('button', { name: '목표 저장' }))
  await addReceipt(user, '떡볶이', '3000', 'snack')

  expect(screen.getByText('목표까지 2,000원 남았어요.')).toBeInTheDocument()
  expect(screen.getByText('60% 사용')).toBeInTheDocument()
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- src/App.test.tsx
```

Expected: FAIL because the weekly goal UI does not exist.

- [ ] **Step 3: Create `WeeklyGoalCard`**

Create `src/components/WeeklyGoalCard.tsx`:

```tsx
import { type FormEvent, useState } from 'react'
import {
  type WeeklyGoalStatus,
  normalizeWeeklyGoalAmount,
} from '../lib/weeklyGoal'

type WeeklyGoalCardProps = {
  goalAmount: number | null
  status: WeeklyGoalStatus | null
  onSave: (goalAmount: number) => void
  onClear: () => void
}

function WeeklyGoalCard({
  goalAmount,
  status,
  onSave,
  onClear,
}: WeeklyGoalCardProps) {
  const [draftGoal, setDraftGoal] = useState(goalAmount ? String(goalAmount) : '')
  const [error, setError] = useState('')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const normalizedGoal = normalizeWeeklyGoalAmount(draftGoal)

    if (normalizedGoal === null) {
      setError('목표 금액은 1원 이상 입력하세요.')
      return
    }

    setError('')
    onSave(normalizedGoal)
    setDraftGoal(String(normalizedGoal))
  }

  return (
    <section className="panel goal-panel" aria-labelledby="goal-title">
      <div className="section-heading">
        <p className="eyebrow">이번 주 계획</p>
        <h2 id="goal-title">목표 금액 정하기</h2>
      </div>

      <form className="goal-form" onSubmit={handleSubmit} noValidate>
        <label htmlFor="weekly-goal">이번 주 목표 금액</label>
        <div className="goal-input-row">
          <input
            id="weekly-goal"
            inputMode="numeric"
            min="1"
            type="number"
            value={draftGoal}
            onChange={(event) => setDraftGoal(event.target.value)}
            placeholder="예: 10000"
            aria-describedby={error ? 'weekly-goal-error' : undefined}
          />
          <button className="secondary-button" type="submit">
            목표 저장
          </button>
        </div>
        {error ? (
          <p className="form-error" id="weekly-goal-error">
            {error}
          </p>
        ) : null}
      </form>

      {status ? (
        <div className="goal-status">
          <p>
            <strong>{status.message}</strong>
          </p>
          <div
            className="goal-progress"
            role="progressbar"
            aria-label="이번 주 목표 금액 사용률"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={status.percentUsed}
          >
            <span style={{ width: `${status.percentUsed}%` }} />
          </div>
          <p className="goal-percent">{status.percentUsed}% 사용</p>
          <button className="text-button" type="button" onClick={onClear}>
            목표 지우기
          </button>
        </div>
      ) : (
        <p className="empty-text">목표 금액을 정하면 남은 금액을 볼 수 있어요.</p>
      )}
    </section>
  )
}

export default WeeklyGoalCard
```

- [ ] **Step 4: Wire goal state in `App.tsx`**

Import the component and helpers:

```ts
import WeeklyGoalCard from './components/WeeklyGoalCard'
import {
  calculateWeeklyGoalStatus,
  clearWeeklyGoalAmount,
  loadWeeklyGoalAmount,
  saveWeeklyGoalAmount,
} from './lib/weeklyGoal'
```

Add state and memoized status:

```ts
const [weeklyGoalAmount, setWeeklyGoalAmount] = useState<number | null>(() =>
  loadWeeklyGoalAmount(),
)

const weeklyGoalStatus = useMemo(
  () =>
    weeklyGoalAmount === null
      ? null
      : calculateWeeklyGoalStatus(weeklyInsight.totalAmount, weeklyGoalAmount),
  [weeklyGoalAmount, weeklyInsight.totalAmount],
)
```

Add handlers:

```ts
const handleSaveWeeklyGoal = (goalAmount: number) => {
  if (!saveWeeklyGoalAmount(goalAmount)) {
    setStatusMessage('브라우저 저장 공간 문제로 목표 금액을 저장하지 못했습니다.')
    return
  }

  setWeeklyGoalAmount(goalAmount)
  setStatusMessage(
    `이번 주 목표 금액 ${formatCurrency(goalAmount)}을 저장했습니다`,
  )
}

const handleClearWeeklyGoal = () => {
  if (!clearWeeklyGoalAmount()) {
    setStatusMessage('브라우저 저장 공간 문제로 목표 금액을 지우지 못했습니다.')
    return
  }

  setWeeklyGoalAmount(null)
  setStatusMessage('이번 주 목표 금액을 지웠습니다')
}
```

Render the card before `WeeklyInsight`:

```tsx
<WeeklyGoalCard
  goalAmount={weeklyGoalAmount}
  status={weeklyGoalStatus}
  onSave={handleSaveWeeklyGoal}
  onClear={handleClearWeeklyGoal}
/>
```

- [ ] **Step 5: Add CSS for goal UI**

Append to `src/App.css`:

```css
.goal-form {
  display: grid;
  gap: 0.75rem;
}

.goal-input-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.75rem;
}

.goal-status {
  display: grid;
  gap: 0.75rem;
}

.goal-progress {
  height: 0.85rem;
  overflow: hidden;
  border-radius: 999px;
  background: #e5e7eb;
}

.goal-progress span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: #15803d;
}

.goal-percent {
  margin: 0;
  color: #4b5563;
  font-weight: 700;
}

.secondary-button,
.text-button {
  border: 0;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
}

.secondary-button {
  border-radius: 0.75rem;
  padding: 0.8rem 1rem;
  background: #14532d;
  color: #fff;
}

.text-button {
  justify-self: start;
  padding: 0;
  background: transparent;
  color: #166534;
}

@media (max-width: 560px) {
  .goal-input-row {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 6: Run tests and commit**

Run:

```bash
npm test -- src/App.test.tsx src/lib/weeklyGoal.test.ts
git add src/App.tsx src/App.css src/App.test.tsx src/components/WeeklyGoalCard.tsx src/lib/weeklyGoal.ts src/lib/weeklyGoal.test.ts
git commit -m "feat: add weekly spending goal"
```

Expected: app flow and weekly goal tests pass and commit is created.

---

### Task 4: Add Weekly CSV and Print Actions

**Files:**
- Create: `src/lib/exportRecords.ts`
- Create: `src/lib/exportRecords.test.ts`
- Create: `src/components/WeeklyReportActions.tsx`
- Modify: `src/App.tsx`
- Modify: `src/App.css`
- Modify: `src/App.test.tsx`

- [ ] **Step 1: Write failing export tests**

Create `src/lib/exportRecords.test.ts`:

```ts
import { expect, test } from 'vitest'
import { createAllowanceEntry, summarizeByCategory } from './allowance'
import { createWeeklyCsv, createWeeklyFileName } from './exportRecords'

test('creates a Korean weekly CSV with escaped values', () => {
  const entries = [
    createAllowanceEntry({
      item: '떡볶이, 음료',
      amount: 3000,
      categoryId: 'snack',
      date: '2026-04-26',
      createdAt: '2026-04-26T03:00:00.000Z',
    }),
  ]
  const csv = createWeeklyCsv(entries, summarizeByCategory(entries))

  expect(csv).toContain('날짜,분류,내용,금액')
  expect(csv).toContain('2026-04-26,간식,"떡볶이, 음료",3000')
  expect(csv).toContain('간식,3000,100%')
})

test('creates a stable weekly file name from a date key', () => {
  expect(createWeeklyFileName('2026-04-26')).toBe(
    'smart-allowance-week-2026-04-26.csv',
  )
})
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm test -- src/lib/exportRecords.test.ts
```

Expected: FAIL because `src/lib/exportRecords.ts` does not exist.

- [ ] **Step 3: Implement export helpers**

Create `src/lib/exportRecords.ts`:

```ts
import { CATEGORIES } from '../data/categories'
import type { AllowanceEntry, CategorySummary } from './allowance'

const categoryLabelById = new Map(
  CATEGORIES.map((category) => [category.id, category.label]),
)

const escapeCsvValue = (value: string | number) => {
  const text = String(value)

  if (!/[",\n]/.test(text)) {
    return text
  }

  return `"${text.replaceAll('"', '""')}"`
}

export const createWeeklyFileName = (dateKey: string) =>
  `smart-allowance-week-${dateKey}.csv`

export const createWeeklyCsv = (
  entries: AllowanceEntry[],
  summaries: CategorySummary[],
) => {
  const sortedEntries = [...entries].sort((left, right) =>
    left.date.localeCompare(right.date),
  )
  const entryRows = sortedEntries.map((entry) =>
    [
      entry.date,
      categoryLabelById.get(entry.categoryId) ?? '기타',
      entry.item,
      entry.amount,
    ]
      .map(escapeCsvValue)
      .join(','),
  )
  const summaryRows = summaries.map((summary) =>
    [summary.label, summary.amount, `${summary.percent}%`]
      .map(escapeCsvValue)
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
```

- [ ] **Step 4: Create report action UI**

Create `src/components/WeeklyReportActions.tsx`:

```tsx
type WeeklyReportActionsProps = {
  hasEntries: boolean
  onDownloadCsv: () => void
  onPrint: () => void
}

function WeeklyReportActions({
  hasEntries,
  onDownloadCsv,
  onPrint,
}: WeeklyReportActionsProps) {
  return (
    <section className="panel report-actions" aria-labelledby="report-actions-title">
      <div className="section-heading">
        <p className="eyebrow">활동 정리</p>
        <h2 id="report-actions-title">주간 기록 활용하기</h2>
      </div>

      <div className="report-button-row">
        <button
          className="secondary-button"
          type="button"
          onClick={onDownloadCsv}
          disabled={!hasEntries}
        >
          CSV 다운로드
        </button>
        <button
          className="secondary-button"
          type="button"
          onClick={onPrint}
          disabled={!hasEntries}
        >
          인쇄하기
        </button>
      </div>
    </section>
  )
}

export default WeeklyReportActions
```

- [ ] **Step 5: Wire export actions in `App.tsx`**

Import:

```ts
import WeeklyReportActions from './components/WeeklyReportActions'
import { createWeeklyCsv, createWeeklyFileName } from './lib/exportRecords'
```

Add handlers:

```ts
const handleDownloadCsv = () => {
  if (weeklyEntries.length === 0) {
    return
  }

  const csv = createWeeklyCsv(weeklyEntries, categorySummaries)
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = createWeeklyFileName(referenceDateKey)
  link.click()
  URL.revokeObjectURL(url)
  setStatusMessage('이번 주 기록 CSV를 만들었습니다')
}

const handlePrintWeeklyReport = () => {
  window.print()
  setStatusMessage('이번 주 기록 인쇄 창을 열었습니다')
}
```

Render after `WeeklyInsight`:

```tsx
<WeeklyReportActions
  hasEntries={weeklyEntries.length > 0}
  onDownloadCsv={handleDownloadCsv}
  onPrint={handlePrintWeeklyReport}
/>
```

- [ ] **Step 6: Add CSS and print rules**

Append to `src/App.css`:

```css
.report-button-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}

.secondary-button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

@media print {
  .form-panel,
  .clear-button,
  .report-actions {
    display: none;
  }

  .app-shell {
    max-width: none;
    padding: 0;
    background: #fff;
  }

  .panel,
  .hero-panel {
    box-shadow: none;
    break-inside: avoid;
  }
}
```

- [ ] **Step 7: Run tests and commit**

Run:

```bash
npm test -- src/lib/exportRecords.test.ts src/App.test.tsx
git add src/App.tsx src/App.css src/App.test.tsx src/components/WeeklyReportActions.tsx src/lib/exportRecords.ts src/lib/exportRecords.test.ts
git commit -m "feat: add weekly report export actions"
```

Expected: export helper and app flow tests pass and commit is created.

---

### Task 5: Final Verification and Release Notes

**Files:**
- Modify: `README.md`
- Modify: `docs/superpowers/plans/2026-05-05-classroom-readiness.md`

- [ ] **Step 1: Run full local verification**

Run:

```bash
npm test
npm run build
```

Expected: all tests pass and `dist/` builds successfully.

- [ ] **Step 2: Update README feature list**

Add these bullets under a `## 주요 기능` heading in `README.md`:

```markdown
## 주요 기능

- 날짜, 항목, 금액, 분류를 입력하는 용돈 기록장
- 이번 주 기록만 모아 보는 영수증 목록
- 카테고리별 소비 비율 원그래프
- 주간 목표 금액과 남은 금액 확인
- CSV 다운로드와 인쇄를 통한 활동 결과 정리
```

- [ ] **Step 3: Mark this plan's completed checkboxes**

Update this plan file so completed steps are marked with `- [x]`.

- [ ] **Step 4: Commit final docs**

Run:

```bash
git add README.md docs/superpowers/plans/2026-05-05-classroom-readiness.md
git commit -m "docs: document classroom readiness improvements"
```

Expected: final documentation commit is created if there are documentation changes.

- [ ] **Step 5: Report branch status**

Run:

```bash
git status --short
git log --oneline --decorate -5
```

Expected: working tree is clean and the latest commits match the implemented tasks.

---

## Self-Review

- Spec coverage: The plan covers classroom documentation, goal-setting self-evaluation, weekly export/print, app integration, tests, and build verification.
- Placeholder scan: No `TBD`, `TODO`, or vague implementation-only steps remain.
- Type consistency: `WeeklyGoalStatus`, `calculateWeeklyGoalStatus`, `createWeeklyCsv`, and `createWeeklyFileName` are introduced before later tasks reference them.
