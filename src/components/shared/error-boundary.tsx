'use client'

import { Component, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onReset?: () => void
}

interface State {
  hasError: boolean
  error: Error | null
}

/**
 * Global Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    console.error('Error Boundary caught an error:', error, errorInfo)
    
    // In production, you would log this to an error tracking service like Sentry
    // if (process.env.NODE_ENV === 'production') {
    //   Sentry.captureException(error, { extra: errorInfo })
    // }
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
    })
    
    if (this.props.onReset) {
      this.props.onReset()
    }
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default fallback UI
      return (
        <div className="flex min-h-screen items-center justify-center p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-destructive" />
                <CardTitle>Something went wrong</CardTitle>
              </div>
              <CardDescription>
                We encountered an unexpected error. Don't worry, your data is safe.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm font-mono text-muted-foreground">
                  {this.state.error?.message || 'Unknown error'}
                </p>
              </div>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium">
                    Error details (development only)
                  </summary>
                  <pre className="mt-2 overflow-auto rounded-lg bg-muted p-4 text-xs">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button onClick={this.resetError} variant="default">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
              <Button onClick={() => window.location.href = '/'} variant="outline">
                <Home className="mr-2 h-4 w-4" />
                Go Home
              </Button>
            </CardFooter>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Feature Error Boundary
 * A lighter-weight error boundary for individual features/components
 */
export function FeatureErrorBoundary({ 
  children, 
  feature 
}: { 
  children: ReactNode
  feature?: string 
}) {
  const fallback = (
    <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-destructive" />
        <p className="text-sm font-medium">
          {feature ? `Error loading ${feature}` : 'Error loading this section'}
        </p>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Please refresh the page or try again later.
      </p>
    </div>
  )

  return (
    <ErrorBoundary fallback={fallback}>
      {children}
    </ErrorBoundary>
  )
}
