import { type FormEvent, useEffect, useState } from 'react'
import {
  type WeeklyBalanceStatus,
  normalizeWeeklyIncomeAmount,
} from '../lib/weeklyBalance'

type WeeklyBalanceCardProps = {
  status: WeeklyBalanceStatus
  message: string
  onClear: () => boolean
  onSave: (incomeAmount: number) => boolean
}

function WeeklyBalanceCard({
  status,
  message,
  onClear,
  onSave,
}: WeeklyBalanceCardProps) {
  const [incomeInput, setIncomeInput] = useState(
    status.hasIncome ? String(status.incomeAmount) : '',
  )
  const [incomeError, setIncomeError] = useState('')

  useEffect(() => {
    setIncomeInput(status.hasIncome ? String(status.incomeAmount) : '')
  }, [status.hasIncome, status.incomeAmount])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextIncomeAmount = normalizeWeeklyIncomeAmount(incomeInput)

    if (nextIncomeAmount === null) {
      setIncomeError('받은 돈은 1원 이상 입력하세요.')
      return
    }

    setIncomeError('')
    onSave(nextIncomeAmount)
  }

  const handleClear = () => {
    if (onClear()) {
      setIncomeError('')
    }
  }

  return (
    <section className="panel balance-panel" aria-labelledby="balance-title">
      <div className="section-heading">
        <p className="eyebrow">수입과 잔액</p>
        <h2 id="balance-title">수입과 잔액 확인</h2>
      </div>

      <form className="balance-form" onSubmit={handleSubmit} noValidate>
        <div className="field-group">
          <label htmlFor="weekly-income-amount">이번 주 받은 돈</label>
          <div className="balance-input-row">
            <input
              id="weekly-income-amount"
              inputMode="numeric"
              min="1"
              type="number"
              value={incomeInput}
              onChange={(event) => setIncomeInput(event.target.value)}
              placeholder="20000"
              aria-describedby={
                incomeError ? 'weekly-income-error' : undefined
              }
            />
            <button className="primary-button" type="submit">
              받은 돈 저장
            </button>
          </div>
          {incomeError ? (
            <p className="form-error" id="weekly-income-error">
              {incomeError}
            </p>
          ) : null}
        </div>
      </form>

      <div className="balance-status">
        <p>{message}</p>
        {status.hasIncome ? (
          <div className="balance-summary" aria-label="이번 주 수입과 잔액 요약">
            <span>
              받은 돈 <strong>{status.incomeAmount.toLocaleString('ko-KR')}원</strong>
            </span>
            <span>
              사용한 돈 <strong>{status.spentAmount.toLocaleString('ko-KR')}원</strong>
            </span>
            <span>
              {status.isShort ? '부족한 돈' : '남은 돈'}{' '}
              <strong>
                {(status.isShort
                  ? status.shortageAmount
                  : status.balanceAmount
                ).toLocaleString('ko-KR')}
                원
              </strong>
            </span>
          </div>
        ) : (
          <p className="empty-text">이번 주 용돈을 먼저 정해 보세요.</p>
        )}
      </div>

      {status.hasIncome ? (
        <button className="balance-clear-button" type="button" onClick={handleClear}>
          받은 돈 지우기
        </button>
      ) : null}
    </section>
  )
}

export default WeeklyBalanceCard
