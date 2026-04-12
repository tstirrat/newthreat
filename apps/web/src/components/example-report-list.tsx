/**
 * Render preconfigured example report links.
 */
import { usePostHog } from 'posthog-js/react'
import type { FC } from 'react'
import { Link } from 'react-router-dom'

import type { ExampleReportLink } from '../types/app'
import { Card, CardContent } from './ui/card'

export type ExampleReportListProps = {
  examples: ExampleReportLink[]
}

export const ExampleReportList: FC<ExampleReportListProps> = ({ examples }) => {
  const posthog = usePostHog()

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
                onClick={() => {
                  posthog?.capture('recents_example_opened', {
                    report_id: example.reportId,
                  })
                }}
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
