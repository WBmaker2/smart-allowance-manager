import { type FormEvent, useState } from 'react'
import { CATEGORIES, type CategoryId } from '../data/categories'

export type EntryFormValues = {
  item: string
  amount: string
  categoryId: CategoryId
  date: string
}

type EntryFormProps = {
  onSubmit: (values: EntryFormValues) => void
}

const getTodayKey = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function EntryForm({ onSubmit }: EntryFormProps) {
  const [item, setItem] = useState('')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState<CategoryId>('snack')
  const [date, setDate] = useState(getTodayKey)
  const [amountError, setAmountError] = useState('')
  const [itemError, setItemError] = useState('')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const numericAmount = Number(amount)
    const nextAmountError =
      !Number.isFinite(numericAmount) || numericAmount < 1
        ? '금액은 1원 이상 입력하세요.'
        : ''
    const nextItemError = item.trim() === '' ? '내용을 입력하세요.' : ''

    setAmountError(nextAmountError)
    setItemError(nextItemError)

    if (nextAmountError || nextItemError) {
      return
    }

    onSubmit({ item, amount, categoryId, date })
    setItem('')
    setAmount('')
    setCategoryId('snack')
    setDate(getTodayKey())
  }

  return (
    <form className="entry-form" onSubmit={handleSubmit} noValidate>
      <div className="field-group">
        <label htmlFor="entry-item">쓴 내용</label>
        <input
          id="entry-item"
          value={item}
          onChange={(event) => setItem(event.target.value)}
          placeholder="예: 떡볶이"
          aria-describedby={itemError ? 'entry-item-error' : undefined}
        />
        {itemError ? (
          <p className="form-error" id="entry-item-error">
            {itemError}
          </p>
        ) : null}
      </div>

      <div className="field-row">
        <div className="field-group">
          <label htmlFor="entry-amount">금액</label>
          <input
            id="entry-amount"
            inputMode="numeric"
            min="1"
            type="number"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="3000"
            aria-describedby={amountError ? 'entry-amount-error' : undefined}
          />
          {amountError ? (
            <p className="form-error" id="entry-amount-error">
              {amountError}
            </p>
          ) : null}
        </div>

        <div className="field-group">
          <label htmlFor="entry-category">분류</label>
          <select
            id="entry-category"
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value as CategoryId)}
          >
            {CATEGORIES.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="field-group">
        <label htmlFor="entry-date">날짜</label>
        <input
          id="entry-date"
          type="date"
          value={date}
          onChange={(event) => setDate(event.target.value)}
        />
      </div>

      <button className="primary-button" type="submit">
        기록하기
      </button>
    </form>
  )
}

export default EntryForm
