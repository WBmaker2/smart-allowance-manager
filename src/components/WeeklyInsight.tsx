import type { WeeklyInsight as WeeklyInsightData } from '../lib/allowance'

type WeeklyInsightProps = {
  insight: WeeklyInsightData
}

const formatCurrency = (amount: number) => `${amount.toLocaleString('ko-KR')}원`

function WeeklyInsight({ insight }: WeeklyInsightProps) {
  const topCategoryText = insight.topCategoryLabel
    ? `${insight.topCategoryLabel} ${insight.topCategoryPercent}%`
    : '기록 없음'

  return (
    <section className="panel insight-panel" aria-labelledby="insight-title">
      <div className="section-heading">
        <p className="eyebrow">주간 생각 정리</p>
        <h2 id="insight-title">소비 습관 돌아보기</h2>
      </div>

      <div className="insight-list">
        <p>
          <strong>이번 주 사용한 돈: {formatCurrency(insight.totalAmount)}</strong>
        </p>
        <p>
          <strong>가장 큰 비율: {topCategoryText}</strong>
        </p>
      </div>

      <p className="reflection-text">
        <strong>생각해 보기:</strong> {insight.message}
      </p>
    </section>
  )
}

export default WeeklyInsight
