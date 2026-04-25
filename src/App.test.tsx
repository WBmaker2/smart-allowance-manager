import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders the Korean classroom allowance shell', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', {
        name: '우리 반 꼬마 CEO: 스마트 용돈 기입장',
      }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('이번 주 용돈 사용을 입력하고 소비 비율을 살펴봅니다.'),
    ).toBeInTheDocument()
  })
})
