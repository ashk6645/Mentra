import { NextRequest } from 'next/server'

// Simple in-memory rate limiter (for development)
// For production, use Redis or Upstash
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

interface RateLimitConfig {
  interval: number // Time window in milliseconds
  uniqueTokenPerInterval: number // Max requests per interval
}

export function rateLimit(config: RateLimitConfig = { interval: 60000, uniqueTokenPerInterval: 10 }) {
  return {
    check: async (request: NextRequest, limit: number = config.uniqueTokenPerInterval) => {
      const token = getTokenFromRequest(request)
      const now = Date.now()
      const resetTime = now + config.interval

      const tokenData = rateLimitMap.get(token)

      if (!tokenData || now > tokenData.resetTime) {
        rateLimitMap.set(token, { count: 1, resetTime })
        return { success: true, remaining: limit - 1 }
      }

      if (tokenData.count >= limit) {
        return { 
          success: false, 
          remaining: 0,
          resetTime: tokenData.resetTime 
        }
      }

      tokenData.count++
      return { success: true, remaining: limit - tokenData.count }
    }
  }
}

function getTokenFromRequest(request: NextRequest): string {
  // Use IP address as token
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'
  
  // Include user agent for better uniqueness
  const userAgent = request.headers.get('user-agent') || 'unknown'
  
  return `${ip}-${userAgent}`
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [token, data] of rateLimitMap.entries()) {
    if (now > data.resetTime) {
      rateLimitMap.delete(token)
    }
  }
}, 60000) // Cleanup every minute
