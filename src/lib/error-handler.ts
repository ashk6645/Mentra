import { toast } from '@/components/ui/use-toast'

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public userMessage?: string
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function handleError(error: unknown, context?: string): AppError {
  console.error(`Error in ${context || 'unknown context'}:`, error)

  // Handle different error types
  if (error instanceof AppError) {
    return error
  }

  if (error instanceof Error) {
    return new AppError(
      error.message,
      'UNKNOWN_ERROR',
      500,
      'An unexpected error occurred. Please try again.'
    )
  }

  return new AppError(
    'Unknown error',
    'UNKNOWN_ERROR',
    500,
    'Something went wrong. Please try again.'
  )
}

export function showErrorToast(error: unknown, context?: string) {
  const appError = handleError(error, context)
  
  toast({
    title: 'Error',
    description: appError.userMessage || appError.message,
    variant: 'destructive',
  })
}

export function showSuccessToast(message: string, description?: string) {
  toast({
    title: message,
    description,
  })
}

// Common error messages
export const ErrorMessages = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You need to be logged in to perform this action.',
  FORBIDDEN: 'You don\'t have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  RATE_LIMIT: 'Too many requests. Please slow down.',
  DATABASE_ERROR: 'Database error. Please try again.',
}

// Error codes
export const ErrorCodes = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  RATE_LIMIT: 'RATE_LIMIT',
  DATABASE_ERROR: 'DATABASE_ERROR',
}
