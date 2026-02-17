/**
 * Render recent reports from local history.
 */
import type { FC } from 'react'
import { Link } from 'react-router-dom'

import type { RecentReportEntry } from '../types/app'
import { Card, CardContent } from './ui/card'

export type RecentReportsListProps = {
  reports: RecentReportEntry[]
}

export const RecentReportsList: FC<RecentReportsListProps> = ({ reports }) => {
  if (reports.length === 0) {
    return <p className="text-sm text-muted">No recent reports yet.</p>
  }

  return (
    <ul aria-label="Recent reports" className="space-y-2">
      {reports.map((report) => (
        <li key={report.reportId}>
          <Card className="bg-panel" size="sm">
            <CardContent className="space-y-1">
              <Link
                className="font-medium underline"
                state={{ host: report.sourceHost }}
                to={`/report/${report.reportId}`}
              >
                {report.title || report.reportId}
              </Link>
              <p className="text-xs text-muted">
                {report.sourceHost} ·{' '}
                {new Date(report.lastOpenedAt).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  )
}
