// Type-only: keeps this module free of any next/server runtime import, so it stays
// loadable in plain unit tests and adds nothing to the Edge bundle.
import type { NextRequest } from 'next/server'

/**
 * Request rate limiting.
 *
 * Runs inside middleware, which executes on the Edge runtime — so this module
 * must stay free of Node built-ins, and must not hold timers or unbounded state.
 *
 * Two backends:
 *   - Upstash Redis over REST, used automatically when UPSTASH_REDIS_REST_URL and
 *     UPSTASH_REDIS_REST_TOKEN are set. Counters are shared across every serverless
 *     instance, which is the only way the limit means what it says in production.
 *   - An in-process fallback, used otherwise. Correct and bounded, but each
 *     instance keeps its own counters, so the effective limit is
 *     `limit x instance count`. Fine for local development and single-instance
 *     deploys; set the Upstash vars before relying on it under real traffic.
 */

export interface RateLimitResult {
    success: boolean
    limit: number
    remaining: number
    /** Epoch ms at which the current window expires. */
    resetTime: number
}

export interface RateLimitConfig {
    /** Window length in milliseconds. */
    interval: number
    /** Default request allowance per window. */
    uniqueTokenPerInterval: number
}

interface RateLimitStore {
    hit(key: string, limit: number, windowMs: number, now: number): Promise<RateLimitResult>
}

/**
 * Hard ceiling on tracked keys for the in-process store.
 *
 * Without this, an attacker rotating source IPs grows the map until the instance
 * runs out of memory. At the cap we sweep expired entries first, then evict the
 * oldest — Map iterates in insertion order, so the first key is the least recently
 * created. Eviction can only ever let a request through, never wrongly block one.
 */
const MAX_TRACKED_KEYS = 10_000

interface WindowState {
    /** Index of the window this counter belongs to (floor(now / windowMs)). */
    window: number
    /** Requests counted in `window`. */
    count: number
    /** Requests counted in `window - 1`, kept for the sliding-window estimate. */
    previous: number
}

/**
 * In-process sliding-window counter.
 *
 * A plain fixed window lets a caller spend its full allowance at the end of one
 * window and again at the start of the next — a 2x burst across the boundary. This
 * weights the previous window's count by how much of it is still in view, which
 * smooths that out for one extra number per key.
 */
class MemoryStore implements RateLimitStore {
    private readonly entries = new Map<string, WindowState>()

    async hit(key: string, limit: number, windowMs: number, now: number): Promise<RateLimitResult> {
        const window = Math.floor(now / windowMs)
        const resetTime = (window + 1) * windowMs

        let state = this.entries.get(key)

        if (!state) {
            this.evictIfNeeded(now, windowMs)
            state = { window, count: 0, previous: 0 }
            this.entries.set(key, state)
        } else if (state.window !== window) {
            // Only the immediately preceding window still overlaps the current one.
            state.previous = state.window === window - 1 ? state.count : 0
            state.count = 0
            state.window = window
        }

        // Fraction of the previous window still inside the trailing `windowMs`.
        const carryOver = (windowMs - (now % windowMs)) / windowMs
        const estimated = state.previous * carryOver + state.count + 1

        if (estimated > limit) {
            // Do not count rejected requests: a caller hammering a closed window
            // would otherwise hold it closed indefinitely.
            return { success: false, limit, remaining: 0, resetTime }
        }

        state.count++

        // Refresh insertion order so active keys are evicted last.
        this.entries.delete(key)
        this.entries.set(key, state)

        return {
            success: true,
            limit,
            remaining: Math.max(0, Math.floor(limit - estimated)),
            resetTime,
        }
    }

    /**
     * Amortised O(1): the O(n) sweep runs at most once per MAX_TRACKED_KEYS inserts.
     * Replaces the old module-scope setInterval, which kept a timer alive for the
     * lifetime of every worker and is not something the Edge runtime should carry.
     */
    private evictIfNeeded(now: number, windowMs: number): void {
        if (this.entries.size < MAX_TRACKED_KEYS) return

        const staleBefore = Math.floor(now / windowMs) - 1

        for (const [key, state] of this.entries) {
            if (state.window < staleBefore) this.entries.delete(key)
        }

        // Still full: every key is live, so drop the oldest to stay bounded.
        while (this.entries.size >= MAX_TRACKED_KEYS) {
            const oldest = this.entries.keys().next()
            if (oldest.done) break
            this.entries.delete(oldest.value)
        }
    }

    /** Test seam. */
    clear(): void {
        this.entries.clear()
    }
}

/**
 * Upstash Redis over REST. Plain fetch — no SDK, so it adds no dependency and
 * runs unchanged on the Edge runtime.
 *
 * Fixed window here rather than sliding: the window index is part of the key, so
 * expiry is automatic and the whole operation is one round trip. Sharing the
 * counter across instances matters far more than smoothing the boundary burst.
 */
class UpstashStore implements RateLimitStore {
    constructor(
        private readonly url: string,
        private readonly token: string
    ) {}

    async hit(key: string, limit: number, windowMs: number, now: number): Promise<RateLimitResult> {
        const window = Math.floor(now / windowMs)
        const resetTime = (window + 1) * windowMs
        const redisKey = `mentra:rl:${key}:${window}`

        // Two windows of TTL so a clock skew between instances cannot expire a
        // counter that is still being read.
        const ttlMs = windowMs * 2

        const response = await fetch(`${this.url}/pipeline`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${this.token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify([
                ['INCR', redisKey],
                ['PEXPIRE', redisKey, String(ttlMs)],
            ]),
            cache: 'no-store',
        })

        if (!response.ok) {
            throw new Error(`Upstash responded ${response.status}`)
        }

        const body = (await response.json()) as Array<{ result?: number; error?: string }>
        const incr = body?.[0]

        if (!incr || typeof incr.result !== 'number') {
            throw new Error(incr?.error || 'Malformed Upstash pipeline response')
        }

        const count = incr.result

        return {
            success: count <= limit,
            limit,
            remaining: Math.max(0, limit - count),
            resetTime,
        }
    }
}

let cachedStore: RateLimitStore | null = null

function getStore(): RateLimitStore {
    if (cachedStore) return cachedStore

    const url = process.env.UPSTASH_REDIS_REST_URL
    const token = process.env.UPSTASH_REDIS_REST_TOKEN

    cachedStore = url && token ? new UpstashStore(url, token) : new MemoryStore()

    return cachedStore
}

export function rateLimit(
    config: RateLimitConfig = { interval: 60_000, uniqueTokenPerInterval: 10 }
) {
    return {
        check: async (request: NextRequest, limit = config.uniqueTokenPerInterval): Promise<RateLimitResult> => {
            const key = getClientKey(request)
            const now = Date.now()

            try {
                return await getStore().hit(key, limit, config.interval, now)
            } catch (error) {
                // Fail open. A limiter that takes the whole app down when its backing
                // store blips is a worse outage than the abuse it prevents — and the
                // Edge runtime gives us no safe way to retry inside a request.
                console.error('rateLimit: store unavailable, allowing request', error)

                return {
                    success: true,
                    limit,
                    remaining: limit,
                    resetTime: now + config.interval,
                }
            }
        },
    }
}

/**
 * Identify the caller.
 *
 * Deliberately IP-only. The previous implementation mixed in the User-Agent
 * header, which the client controls — rotating it produced a fresh bucket per
 * request and made the limit unenforceable against exactly the traffic it exists
 * to stop.
 *
 * x-forwarded-for is spoofable when nothing trusted sets it. On Vercel the edge
 * network overwrites it, so the leftmost entry is the real client.
 */
export function getClientKey(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for')

    if (forwarded) {
        const first = forwarded.split(',')[0]?.trim()
        if (first) return first
    }

    return request.headers.get('x-real-ip')?.trim() || 'unknown'
}

/** Reset in-process counters. Test-only; no-op when Upstash is configured. */
export function __resetRateLimitStoreForTests(): void {
    if (cachedStore instanceof MemoryStore) cachedStore.clear()
    cachedStore = null
}
