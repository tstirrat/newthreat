/**
 * Render preconfigured example report links.
 */
import { usePostHog } from 'posthog-js/react'
import type { FC } from 'react'
import { Link } from 'react-router-dom'

import type { ExampleReportLink } from '../types/app'

export type ExampleReportListProps = {
  examples: ExampleReportLink[]
}

export const ExampleReportList: FC<ExampleReportListProps> = ({ examples }) => {
  const posthog = usePostHog()

  return (
    <ul aria-label="Example reports" className="space-y-1">
      {examples.map((example) => (
        <li key={example.reportId}>
          <Link
            className="group flex items-baseline gap-2 font-medium underline"
            state={{ host: example.host }}
            to={`/report/${example.reportId}`}
            onClick={() => {
              posthog?.capture('recents_example_opened', {
                report_id: example.reportId,
              })
            }}
          >
            {example.label}
            {example.zoneName ? (
              <span className="text-xs font-normal text-muted-foreground no-underline group-hover:text-foreground">
                {example.zoneName}
              </span>
            ) : null}
          </Link>
        </li>
      ))}
    </ul>
  )
}
