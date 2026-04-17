/**
 * Root-level React error boundary that catches unhandled component errors
 * and renders a user-friendly fallback UI with a reload option.
 */
import { captureException } from '@sentry/react'
import { Component, type ErrorInfo, type ReactNode } from 'react'

import {
  ErrorBoundaryFallback,
  type ErrorBoundaryFallbackProps,
} from './error-boundary-fallback'

export type ErrorBoundaryProps = {
  children: ReactNode
  fallback?: (props: ErrorBoundaryFallbackProps) => ReactNode
}

type ErrorBoundaryState = {
  hasError: boolean
  error: Error | null
}

/** React error boundary that catches render errors in its subtree. */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo)
    captureException(error, {
      extra: { componentStack: errorInfo.componentStack },
    })
  }

  private readonly resetError = (): void => {
    this.setState({ hasError: false, error: null })
  }

  override render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          resetError: this.resetError,
        })
      }
      return (
        <ErrorBoundaryFallback
          error={this.state.error}
          resetError={this.resetError}
        />
      )
    }

    return this.props.children
  }
}
