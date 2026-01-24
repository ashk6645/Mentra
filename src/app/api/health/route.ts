import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { withErrorHandler, createApiResponse } from '@/lib/api-handler'
import { AppError, ErrorCodes } from '@/lib/error-handler'

export const dynamic = 'force-dynamic'

async function handler(request: NextRequest) {
  // Check database connection
  await prisma.$queryRaw`SELECT 1`
  
  return createApiResponse({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected',
      api: 'operational'
    }
  })
}

export const GET = withErrorHandler(handler)
