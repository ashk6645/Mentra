import { NextRequest, NextResponse } from 'next/server'
import { AppError, ErrorCodes, ErrorMessages } from './error-handler'

type ApiHandler = (req: NextRequest, context?: any) => Promise<NextResponse>

export function withErrorHandler(handler: ApiHandler): ApiHandler {
  return async (req: NextRequest, context?: any) => {
    try {
      return await handler(req, context)
    } catch (error) {
      console.error('API Error:', error)

      if (error instanceof AppError) {
        return NextResponse.json(
          {
            error: error.userMessage || error.message,
            code: error.code,
          },
          { status: error.statusCode || 500 }
        )
      }

      if (error instanceof Error) {
        // Handle specific error types
        if (error.message.includes('ECONNREFUSED')) {
          return NextResponse.json(
            {
              error: ErrorMessages.DATABASE_ERROR,
              code: ErrorCodes.DATABASE_ERROR,
            },
            { status: 503 }
          )
        }

        if (error.message.includes('Unauthorized')) {
          return NextResponse.json(
            {
              error: ErrorMessages.UNAUTHORIZED,
              code: ErrorCodes.UNAUTHORIZED,
            },
            { status: 401 }
          )
        }
      }

      // Generic error response
      return NextResponse.json(
        {
          error: ErrorMessages.SERVER_ERROR,
          code: ErrorCodes.SERVER_ERROR,
        },
        { status: 500 }
      )
    }
  }
}

export function createApiResponse<T>(data: T, status: number = 200) {
  return NextResponse.json({ success: true, data }, { status })
}

export function createErrorResponse(message: string, code: string, status: number = 400) {
  return NextResponse.json({ success: false, error: message, code }, { status })
}
