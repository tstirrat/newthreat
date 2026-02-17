/**
 * Simple loading panel used across pages.
 */
import type { FC } from 'react'

import { Card, CardContent } from './ui/card'

export type LoadingStateProps = {
  message: string
}

export const LoadingState: FC<LoadingStateProps> = ({ message }) => {
  return (
    <Card aria-live="polite" className="bg-panel shadow-sm" role="status">
      <CardContent>
        <p className="text-sm text-muted">{message}</p>
      </CardContent>
    </Card>
  )
}
