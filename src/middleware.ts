import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { rateLimit } from '@/lib/rate-limit'

const limiter = rateLimit({
    interval: 60000, // 1 minute
    uniqueTokenPerInterval: 100, // 100 requests per minute per IP
})

export async function updateSession(request: NextRequest) {
    // Apply rate limiting to API routes
    if (request.nextUrl.pathname.startsWith('/api/')) {
        const rateLimitResult = await limiter.check(request, 30) // 30 requests per minute for API

        if (!rateLimitResult.success) {
            return NextResponse.json(
                { error: 'Too many requests. Please try again later.' },
                {
                    status: 429,
                    headers: {
                        'X-RateLimit-Limit': '30',
                        'X-RateLimit-Remaining': '0',
                        'X-RateLimit-Reset': new Date(rateLimitResult.resetTime || Date.now()).toISOString(),
                    }
                }
            )
        }
    }

    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    )

                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })

                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const { data: { user } } = await supabase.auth.getUser()

    // Redirect authenticated users from login/signup to today page
    if (user && (request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/signup'))) {
        return NextResponse.redirect(new URL('/today', request.url))
    }

    return response
}

export async function middleware(request: NextRequest) {
    return await updateSession(request)
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
