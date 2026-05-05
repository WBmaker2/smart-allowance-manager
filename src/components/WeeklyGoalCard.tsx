import { type FormEvent, useEffect, useState } from 'react'
import {
  type WeeklyGoalStatus,
  normalizeWeeklyGoalAmount,
} from '../lib/weeklyGoal'

type WeeklyGoalCardProps = {
  status: WeeklyGoalStatus
  message: string
  onClear: () => boolean
  onSave: (goalAmount: number) => boolean
}

function WeeklyGoalCard({
  status,
  message,
  onClear,
  onSave,
}: WeeklyGoalCardProps) {
  const [goalInput, setGoalInput] = useState(
    status.hasGoal ? String(status.goalAmount) : '',
  )
  const [goalError, setGoalError] = useState('')

  useEffect(() => {
    setGoalInput(status.hasGoal ? String(status.goalAmount) : '')
  }, [status.goalAmount, status.hasGoal])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const nextGoalAmount = normalizeWeeklyGoalAmount(goalInput)

    if (nextGoalAmount === null) {
      setGoalError('목표 금액은 1원 이상 입력하세요.')
      return
    }

    setGoalError('')
    onSave(nextGoalAmount)
  }

  const handleClear = () => {
    if (onClear()) {
      setGoalError('')
    }
  }

  return (
    <section className="panel goal-panel" aria-labelledby="goal-title">
      <div className="section-heading">
        <p className="eyebrow">주간 목표</p>
        <h2 id="goal-title">목표 금액 정하기</h2>
      </div>

      <form className="goal-form" onSubmit={handleSubmit} noValidate>
        <div className="field-group">
          <label htmlFor="weekly-goal-amount">이번 주 목표 금액</label>
          <div className="goal-input-row">
            <input
              id="weekly-goal-amount"
              inputMode="numeric"
              min="1"
              type="number"
              value={goalInput}
              onChange={(event) => setGoalInput(event.target.value)}
              placeholder="10000"
              aria-describedby={goalError ? 'weekly-goal-error' : undefined}
            />
            <button className="primary-button" type="submit">
              목표 저장
            </button>
          </div>
          {goalError ? (
            <p className="form-error" id="weekly-goal-error">
              {goalError}
            </p>
          ) : null}
        </div>
      </form>

      <div className="goal-status">
        <p>{message}</p>
        {status.hasGoal ? (
          <p
            className="goal-progress"
            role="progressbar"
            aria-label="주간 목표 사용률"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={status.percentUsed}
          >
            {status.percentUsed}% 사용
          </p>
        ) : (
          <p className="empty-text">
            목표 금액을 정하면 남은 금액을 볼 수 있어요.
          </p>
        )}
      </div>

      {status.hasGoal ? (
        <button className="goal-clear-button" type="button" onClick={handleClear}>
          목표 지우기
        </button>
      ) : null}
    </section>
  )
}

export default WeeklyGoalCard
