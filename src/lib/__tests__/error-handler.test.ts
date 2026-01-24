import { AppError, handleError, ErrorCodes, ErrorMessages } from '../error-handler'

describe('AppError', () => {
  it('should create an AppError with all properties', () => {
    const error = new AppError(
      'Technical message',
      'TEST_CODE',
      400,
      'User friendly message'
    )

    expect(error.message).toBe('Technical message')
    expect(error.code).toBe('TEST_CODE')
    expect(error.statusCode).toBe(400)
    expect(error.userMessage).toBe('User friendly message')
    expect(error.name).toBe('AppError')
  })

  it('should create an AppError with minimal properties', () => {
    const error = new AppError('Technical message')

    expect(error.message).toBe('Technical message')
    expect(error.code).toBeUndefined()
    expect(error.statusCode).toBeUndefined()
    expect(error.userMessage).toBeUndefined()
  })
})

describe('handleError', () => {
  it('should return AppError as-is', () => {
    const originalError = new AppError('Test', 'CODE', 400, 'User message')
    const result = handleError(originalError, 'test context')

    expect(result).toBe(originalError)
    expect(result.message).toBe('Test')
    expect(result.code).toBe('CODE')
  })

  it('should convert Error to AppError', () => {
    const originalError = new Error('Standard error')
    const result = handleError(originalError, 'test context')

    expect(result).toBeInstanceOf(AppError)
    expect(result.message).toBe('Standard error')
    expect(result.code).toBe('UNKNOWN_ERROR')
    expect(result.statusCode).toBe(500)
    expect(result.userMessage).toBe('An unexpected error occurred. Please try again.')
  })

  it('should convert unknown error to AppError', () => {
    const result = handleError('string error', 'test context')

    expect(result).toBeInstanceOf(AppError)
    expect(result.message).toBe('Unknown error')
    expect(result.code).toBe('UNKNOWN_ERROR')
    expect(result.statusCode).toBe(500)
  })

  it('should log error with context', () => {
    const consoleSpy = jest.spyOn(console, 'error')
    const error = new Error('Test error')
    
    handleError(error, 'test context')

    expect(consoleSpy).toHaveBeenCalledWith(
      'Error in test context:',
      error
    )
  })
})

describe('ErrorMessages', () => {
  it('should have all required error messages', () => {
    expect(ErrorMessages.NETWORK_ERROR).toBeDefined()
    expect(ErrorMessages.UNAUTHORIZED).toBeDefined()
    expect(ErrorMessages.FORBIDDEN).toBeDefined()
    expect(ErrorMessages.NOT_FOUND).toBeDefined()
    expect(ErrorMessages.VALIDATION_ERROR).toBeDefined()
    expect(ErrorMessages.SERVER_ERROR).toBeDefined()
    expect(ErrorMessages.RATE_LIMIT).toBeDefined()
    expect(ErrorMessages.DATABASE_ERROR).toBeDefined()
  })
})

describe('ErrorCodes', () => {
  it('should have all required error codes', () => {
    expect(ErrorCodes.NETWORK_ERROR).toBe('NETWORK_ERROR')
    expect(ErrorCodes.UNAUTHORIZED).toBe('UNAUTHORIZED')
    expect(ErrorCodes.FORBIDDEN).toBe('FORBIDDEN')
    expect(ErrorCodes.NOT_FOUND).toBe('NOT_FOUND')
    expect(ErrorCodes.VALIDATION_ERROR).toBe('VALIDATION_ERROR')
    expect(ErrorCodes.SERVER_ERROR).toBe('SERVER_ERROR')
    expect(ErrorCodes.RATE_LIMIT).toBe('RATE_LIMIT')
    expect(ErrorCodes.DATABASE_ERROR).toBe('DATABASE_ERROR')
  })
})
