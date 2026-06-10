import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  /** Content to render when no error has occurred */
  children: ReactNode
  /** Optional custom fallback UI — defaults to built-in error card */
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * Class-based React Error Boundary.
 * Catches unhandled rendering errors in the component subtree and displays
 * a graceful fallback instead of a blank/crashed screen.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <App />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // In production this would forward to a monitoring service (e.g. Sentry)
    console.error('[ErrorBoundary] Uncaught error:', error.message, info.componentStack)
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null })
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div
          role="alert"
          aria-live="assertive"
          className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-green-50 via-white to-teal-50"
        >
          <div className="text-center max-w-md bg-white/90 rounded-2xl border border-red-200 shadow-md p-8">
            <div className="text-5xl mb-4" aria-hidden="true">⚠️</div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h1>
            <p className="text-gray-500 mb-6 text-sm font-mono bg-red-50 p-3 rounded-lg border border-red-100">
              {this.state.error?.message ?? 'An unexpected error occurred.'}
            </p>
            <button
              onClick={this.handleReset}
              className="px-6 py-2.5 bg-green-600 text-white rounded-xl font-medium
                hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-400
                focus:ring-offset-2 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
