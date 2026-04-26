import { act, cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import App from './App'

vi.mock('react-chartjs-2', () => ({
  Pie: () => <div data-testid="spending-pie-chart" />,
}))

const setupUser = () =>
  userEvent.setup({
    advanceTimers: async (delay) => {
      await vi.advanceTimersByTimeAsync(delay)
    },
  })

const addReceipt = async (
  user: ReturnType<typeof setupUser>,
  item: string,
  amount: string,
  categoryId: string,
  date?: string,
) => {
  await user.type(screen.getByLabelText('쓴 내용'), item)
  await user.type(screen.getByLabelText('금액'), amount)
  await user.selectOptions(screen.getByLabelText('분류'), categoryId)

  if (date) {
    await user.clear(screen.getByLabelText('날짜'))
    await user.type(screen.getByLabelText('날짜'), date)
  }

  await user.click(screen.getByRole('button', { name: '기록하기' }))
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  vi.setSystemTime(new Date('2026-04-26T12:00:00+09:00'))
  localStorage.clear()
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  localStorage.clear()
  vi.useRealTimers()
})

test('adds a receipt and updates the weekly category summary', async () => {
  const user = setupUser()
  render(<App />)

  expect(
    screen.getByRole('region', { name: '이번 주 소비 비율 원그래프' }),
  ).toBeInTheDocument()

  await addReceipt(user, '떡볶이', '3000', 'snack')

  expect(screen.getByText('떡볶이')).toBeInTheDocument()
  expect(screen.getByText('3,000원')).toBeInTheDocument()
  expect(screen.getByText('간식 100%')).toBeInTheDocument()
  expect(screen.getByRole('status')).toHaveTextContent(
    '떡볶이 3,000원을 기록했습니다',
  )
})

test('shows an item name validation message and does not create a receipt', async () => {
  const user = setupUser()
  render(<App />)

  await user.type(screen.getByLabelText('금액'), '1200')
  await user.click(screen.getByRole('button', { name: '기록하기' }))

  expect(screen.getByText('내용을 입력하세요.')).toBeInTheDocument()
  expect(screen.queryByText('1,200원')).not.toBeInTheDocument()
  expect(screen.getByText('아직 기록한 영수증이 없습니다.')).toBeInTheDocument()
})

test('loads saved records after rerender', async () => {
  const user = setupUser()
  const { unmount } = render(<App />)

  await addReceipt(user, '연필', '1000', 'school')
  unmount()

  render(<App />)
  expect(screen.getByText('연필')).toBeInTheDocument()
})

test('does not create a receipt when browser storage save fails', async () => {
  const user = setupUser()

  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new DOMException('Storage quota exceeded', 'QuotaExceededError')
  })

  render(<App />)

  await addReceipt(user, '연필', '1000', 'school')

  expect(screen.queryByText('연필')).not.toBeInTheDocument()
  expect(screen.getByText('아직 기록한 영수증이 없습니다.')).toBeInTheDocument()
  expect(screen.getByRole('status')).toHaveTextContent(
    '브라우저 저장 공간 문제로 기록을 저장하지 못했습니다.',
  )
})

test('deletes a receipt and recalculates the weekly category summary', async () => {
  const user = setupUser()
  render(<App />)

  await addReceipt(user, '떡볶이', '3000', 'snack')
  await addReceipt(user, '연필', '1000', 'school')

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

test('shows newer receipt dates before older receipt dates', async () => {
  const user = setupUser()
  render(<App />)

  await addReceipt(user, '토요일 공책', '2000', 'school', '2026-04-25')
  await addReceipt(user, '화요일 간식', '1500', 'snack', '2026-04-21')

  const receiptRegion = screen.getByRole('region', { name: '이번 주 기록' })
  const receiptItems = within(receiptRegion).getAllByRole('listitem')

  expect(within(receiptItems[0]).getByText('토요일 공책')).toBeInTheDocument()
  expect(within(receiptItems[1]).getByText('화요일 간식')).toBeInTheDocument()
})

test('refreshes the weekly view when the calendar day changes', async () => {
  const user = setupUser()
  render(<App />)

  await addReceipt(user, '일요일 간식', '1200', 'snack', '2026-04-26')
  expect(screen.getByText('일요일 간식')).toBeInTheDocument()
  expect(screen.getByText('간식 100%')).toBeInTheDocument()

  act(() => {
    vi.advanceTimersByTime(12 * 60 * 60 * 1000 + 1000)
  })

  expect(screen.queryByText('일요일 간식')).not.toBeInTheDocument()
  expect(screen.getByText('이번 주 기록이 아직 없습니다.')).toBeInTheDocument()
})
