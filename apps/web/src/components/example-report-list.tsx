/**
 * Render preconfigured example report links.
 */
import type { FC } from 'react'
import { Link } from 'react-router-dom'

import type { ExampleReportLink } from '../types/app'
import { Card, CardContent } from './ui/card'

export type ExampleReportListProps = {
  examples: ExampleReportLink[]
}

export const ExampleReportList: FC<ExampleReportListProps> = ({ examples }) => {
  return (
    <ul aria-label="Example reports" className="space-y-2">
      {examples.map((example) => (
        <li key={example.reportId}>
          <Card className="bg-panel" size="sm">
            <CardContent className="space-y-1">
              <Link
                className="font-medium underline"
                state={{ host: example.host }}
                to={`/report/${example.reportId}`}
              >
                {example.label}
              </Link>
              <p className="text-xs text-muted">{example.host}</p>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  )
}
