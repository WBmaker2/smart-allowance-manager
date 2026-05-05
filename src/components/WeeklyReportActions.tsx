type WeeklyReportActionsProps = {
  disabled: boolean
  onDownloadCsv: () => void
  onPrint: () => void
}

function WeeklyReportActions({
  disabled,
  onDownloadCsv,
  onPrint,
}: WeeklyReportActionsProps) {
  return (
    <section className="panel report-actions" aria-labelledby="report-actions-title">
      <div className="section-heading">
        <p className="eyebrow">공유와 정리</p>
        <h2 id="report-actions-title">주간 기록 활용하기</h2>
      </div>

      <div className="report-button-row">
        <button type="button" onClick={onDownloadCsv} disabled={disabled}>
          CSV 다운로드
        </button>
        <button type="button" onClick={onPrint} disabled={disabled}>
          인쇄하기
        </button>
      </div>
    </section>
  )
}

export default WeeklyReportActions
