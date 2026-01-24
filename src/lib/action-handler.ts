import { AppError, ErrorCodes, ErrorMessages } from './error-handler'

export type ActionResult<T = any> = {
  success: boolean
  data?: T
  error?: string | Record<string, any>
}

export async function withActionHandler<T>(
  handler: () => Promise<T>,
  context?: string
): Promise<ActionResult<T>> {
  try {
    const data = await handler()
    return { success: true, data }
  } catch (error) {
    console.error(`Action error in ${context || 'unknown'}:`, error)

    if (error instanceof AppError) {
      return {
        success: false,
        error: error.userMessage || error.message,
      }
    }

    // Handle Prisma errors
    if (error && typeof error === 'object' && 'code' in error) {
      const prismaError = error as any
      
      switch (prismaError.code) {
        case 'P2002':
          return {
            success: false,
            error: 'A record with this information already exists',
          }
        case 'P2025':
          return {
            success: false,
            error: ErrorMessages.NOT_FOUND,
          }
        case 'P2003':
          return {
            success: false,
            error: 'Invalid reference to related data',
          }
        case 'P2024':
          return {
            success: false,
            error: ErrorMessages.DATABASE_ERROR,
          }
        default:
          return {
            success: false,
            error: ErrorMessages.DATABASE_ERROR,
          }
      }
    }

    // Handle validation errors (Zod)
    if (error && typeof error === 'object' && 'issues' in error) {
      return {
        success: false,
        error: 'Validation failed. Please check your input.',
      }
    }

    // Generic error
    return {
      success: false,
      error: ErrorMessages.SERVER_ERROR,
    }
  }
}

export function createSuccessResult<T>(data: T): ActionResult<T> {
  return { success: true, data }
}

export function createErrorResult(error: string): ActionResult {
  return { success: false, error }
}
