import {
  ArcElement,
  Chart as ChartJS,
  Legend,
  Tooltip,
  type ChartOptions,
} from 'chart.js'
import { Pie } from 'react-chartjs-2'
import type { CategorySummary } from '../lib/allowance'

ChartJS.register(ArcElement, Tooltip, Legend)

type SpendingPieChartProps = {
  summaries: CategorySummary[]
}

const chartOptions: ChartOptions<'pie'> = {
  plugins: {
    legend: {
      position: 'bottom',
    },
  },
  responsive: true,
  maintainAspectRatio: false,
}

function SpendingPieChart({ summaries }: SpendingPieChartProps) {
  const chartData = {
    labels: summaries.map((summary) => summary.label),
    datasets: [
      {
        data: summaries.map((summary) => summary.amount),
        backgroundColor: summaries.map((summary) => summary.color),
        borderColor: '#fffdf8',
        borderWidth: 3,
      },
    ],
  }

  return (
    <section className="panel chart-panel" aria-labelledby="chart-title">
      <div className="section-heading">
        <p className="eyebrow">소비 비율</p>
        <h2 id="chart-title">이번 주 카테고리</h2>
      </div>

      {summaries.length === 0 ? (
        <p className="empty-text">이번 주 기록이 아직 없습니다.</p>
      ) : (
        <div className="chart-wrap" aria-label="이번 주 소비 비율 그래프">
          <Pie data={chartData} options={chartOptions} />
        </div>
      )}

      {summaries.length > 0 ? (
        <ul className="summary-list" aria-label="카테고리별 사용 비율">
          {summaries.map((summary) => (
            <li key={summary.categoryId}>
              <span
                className="summary-swatch"
                style={{ backgroundColor: summary.color }}
                aria-hidden="true"
              />
              <span>{`${summary.label} ${summary.percent}%`}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}

export default SpendingPieChart
