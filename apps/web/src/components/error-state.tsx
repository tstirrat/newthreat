/**
 * Error panel used across page-level query failures.
 */
import type { FC } from 'react'

import { Alert, AlertDescription, AlertTitle } from './ui/alert'

export type ErrorStateProps = {
  title: string
  message: string
}

export const ErrorState: FC<ErrorStateProps> = ({ title, message }) => {
  return (
    <Alert aria-live="assertive" role="alert" variant="destructive">
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  )
}
