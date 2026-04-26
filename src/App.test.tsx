import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import App from './App'

vi.mock('react-chartjs-2', () => ({
  Pie: () => <div data-testid="spending-pie-chart" />,
}))

beforeEach(() => localStorage.clear())
afterEach(() => cleanup())

test('adds a receipt and updates the weekly category summary', async () => {
  const user = userEvent.setup()
  render(<App />)

  await user.type(screen.getByLabelText('쓴 내용'), '떡볶이')
  await user.type(screen.getByLabelText('금액'), '3000')
  await user.selectOptions(screen.getByLabelText('분류'), 'snack')
  await user.click(screen.getByRole('button', { name: '기록하기' }))

  expect(screen.getByText('떡볶이')).toBeInTheDocument()
  expect(screen.getByText('3,000원')).toBeInTheDocument()
  expect(screen.getByText('간식 100%')).toBeInTheDocument()
  expect(screen.getByRole('status')).toHaveTextContent(
    '떡볶이 3,000원을 기록했습니다',
  )
})

test('loads saved records after rerender', async () => {
  const user = userEvent.setup()
  const { unmount } = render(<App />)

  await user.type(screen.getByLabelText('쓴 내용'), '연필')
  await user.type(screen.getByLabelText('금액'), '1000')
  await user.selectOptions(screen.getByLabelText('분류'), 'school')
  await user.click(screen.getByRole('button', { name: '기록하기' }))
  unmount()

  render(<App />)
  expect(screen.getByText('연필')).toBeInTheDocument()
})

test('deletes a receipt and recalculates the weekly category summary', async () => {
  const user = userEvent.setup()
  render(<App />)

  await user.type(screen.getByLabelText('쓴 내용'), '떡볶이')
  await user.type(screen.getByLabelText('금액'), '3000')
  await user.selectOptions(screen.getByLabelText('분류'), 'snack')
  await user.click(screen.getByRole('button', { name: '기록하기' }))

  await user.type(screen.getByLabelText('쓴 내용'), '연필')
  await user.type(screen.getByLabelText('금액'), '1000')
  await user.selectOptions(screen.getByLabelText('분류'), 'school')
  await user.click(screen.getByRole('button', { name: '기록하기' }))

  expect(screen.getByText('간식 75%')).toBeInTheDocument()
  expect(screen.getByText('학용품 25%')).toBeInTheDocument()

  const schoolReceipt = screen.getByText('연필').closest('li')
  expect(schoolReceipt).not.toBeNull()
  await user.click(
    within(schoolReceipt as HTMLElement).getByRole('button', { name: '삭제' }),
  )

  expect(screen.queryByText('연필')).not.toBeInTheDocument()
  expect(screen.queryByText('학용품 25%')).not.toBeInTheDocument()
  expect(screen.getByText('간식 100%')).toBeInTheDocument()
})
