import { PerformanceMonitor, debounce, throttle } from '../performance'

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    PerformanceMonitor.clear()
  })

  it('should measure async function execution time', async () => {
    const result = await PerformanceMonitor.measure('test-operation', async () => {
      return 'success'
    })

    expect(result).toBe('success')
    const stats = PerformanceMonitor.getStats('test-operation')
    expect(stats).toBeDefined()
    expect(stats!.count).toBe(1)
    expect(stats!.avg).toBeGreaterThanOrEqual(0)
  })

  it('should record multiple measurements', async () => {
    await PerformanceMonitor.measure('test', async () => 'result1')
    await PerformanceMonitor.measure('test', async () => 'result2')
    await PerformanceMonitor.measure('test', async () => 'result3')

    const stats = PerformanceMonitor.getStats('test')
    expect(stats!.count).toBe(3)
  })

  it('should handle errors and still record metrics', async () => {
    await expect(
      PerformanceMonitor.measure('error-test', async () => {
        throw new Error('Test error')
      })
    ).rejects.toThrow('Test error')

    const stats = PerformanceMonitor.getStats('error-test_error')
    expect(stats).toBeDefined()
    expect(stats!.count).toBe(1)
  })

  it('should return null for non-existent metrics', () => {
    const stats = PerformanceMonitor.getStats('non-existent')
    expect(stats).toBeNull()
  })

  it('should calculate correct statistics', async () => {
    // Add measurements with known values
    for (let i = 0; i < 10; i++) {
      await PerformanceMonitor.measure('stats-test', async () => {
        return 'done'
      })
    }

    const stats = PerformanceMonitor.getStats('stats-test')
    expect(stats).toBeDefined()
    expect(stats!.count).toBe(10)
    expect(stats!.min).toBeLessThanOrEqual(stats!.max)
    expect(stats!.avg).toBeGreaterThanOrEqual(0)
  })

  it('should clear all metrics', async () => {
    await PerformanceMonitor.measure('test1', async () => 'result')
    await PerformanceMonitor.measure('test2', async () => 'result')

    PerformanceMonitor.clear()

    expect(PerformanceMonitor.getStats('test1')).toBeNull()
    expect(PerformanceMonitor.getStats('test2')).toBeNull()
  })
})

describe('debounce', () => {
  jest.useFakeTimers()

  it('should debounce function calls', () => {
    const mockFn = jest.fn()
    const debouncedFn = debounce(mockFn, 100)

    debouncedFn()
    debouncedFn()
    debouncedFn()

    expect(mockFn).not.toHaveBeenCalled()

    jest.advanceTimersByTime(100)

    expect(mockFn).toHaveBeenCalledTimes(1)
  })

  it('should pass arguments to debounced function', () => {
    const mockFn = jest.fn()
    const debouncedFn = debounce(mockFn, 100)

    debouncedFn('arg1', 'arg2')

    jest.advanceTimersByTime(100)

    expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2')
  })
})

describe('throttle', () => {
  jest.useFakeTimers()

  it('should throttle function calls', () => {
    const mockFn = jest.fn()
    const throttledFn = throttle(mockFn, 100)

    throttledFn()
    throttledFn()
    throttledFn()

    expect(mockFn).toHaveBeenCalledTimes(1)

    jest.advanceTimersByTime(100)

    throttledFn()

    expect(mockFn).toHaveBeenCalledTimes(2)
  })

  it('should pass arguments to throttled function', () => {
    const mockFn = jest.fn()
    const throttledFn = throttle(mockFn, 100)

    throttledFn('arg1', 'arg2')

    expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2')
  })
})
