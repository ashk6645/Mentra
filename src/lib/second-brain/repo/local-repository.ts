import {
    emptyData,
    type SecondBrainData,
    type CollectionName,
} from '../domain/types'
import { type SecondBrainRepository, hasId } from './repository'

/**
 * localStorage-backed implementation.
 *
 * The only file in the feature that knows storage exists. When a backend lands,
 * this is replaced by an `ApiRepository` implementing the same interface and
 * nothing above it changes.
 *
 * Notes on the deliberate choices here:
 *
 * - One key, one JSON blob. Twenty-one separate keys would mean twenty-one
 *   partial-write failure modes; a single blob is atomic per save.
 * - The in-memory `cache` is the source of truth during a session. Reading from
 *   localStorage on every access would parse the whole store on every render.
 * - Mutations update memory and notify subscribers synchronously; only the write
 *   to storage is deferred and coalesced. Callers already treat mutations as
 *   fire-and-notify, so an async `ApiRepository` drops into the same shape.
 */
const STORAGE_KEY = 'mentra.second-brain.v2'

/** How long a burst of writes is allowed to coalesce before hitting storage. */
const PERSIST_DELAY_MS = 300

export class LocalRepository implements SecondBrainRepository {
    private cache: SecondBrainData | null = null
    private readonly listeners = new Set<() => void>()
    private pendingWrite: number | null = null
    private flushBound = false

    constructor(private readonly seedFactory: () => SecondBrainData) {}

    // ─── Reads ───────────────────────────────────────────────────────────────

    read(): SecondBrainData {
        if (this.cache) return this.cache

        // Server render: return an empty store rather than throwing. Callers show
        // a shell until hydration replaces it with the real thing.
        if (typeof window === 'undefined') return emptyData()

        this.cache = this.load()
        return this.cache
    }

    private load(): SecondBrainData {
        try {
            const raw = window.localStorage.getItem(STORAGE_KEY)

            if (!raw) {
                const seeded = this.seedFactory()
                this.persist(seeded)
                return seeded
            }

            // Merge over an empty store so a blob written by an older build that
            // lacks a newer collection still yields a complete shape.
            return { ...emptyData(), ...(JSON.parse(raw) as Partial<SecondBrainData>) }
        } catch {
            // Corrupt JSON, quota, or storage disabled (private mode). Degrade to
            // an in-memory session rather than breaking the route.
            return this.seedFactory()
        }
    }

    // ─── Writes ──────────────────────────────────────────────────────────────

    create<K extends CollectionName>(
        collection: K,
        record: SecondBrainData[K][number]
    ): SecondBrainData[K][number] {
        const data = this.read()
        const next = [...(data[collection] as unknown[]), record] as SecondBrainData[K]

        this.commit({ ...data, [collection]: next })
        return record
    }

    update<K extends CollectionName>(
        collection: K,
        id: string,
        patch: Partial<SecondBrainData[K][number]>
    ): void {
        const data = this.read()
        const now = new Date().toISOString()

        const next = (data[collection] as unknown[]).map(record => {
            if (!hasId(record) || record.id !== id) return record
            // updatedAt is maintained here rather than at every call site — a
            // stamp that depends on remembering to set it is a stamp that lies.
            return { ...record, ...patch, updatedAt: now }
        }) as SecondBrainData[K]

        this.commit({ ...data, [collection]: next })
    }

    remove(collection: CollectionName, id: string): void {
        const data = this.read()

        const next = (data[collection] as unknown[]).filter(
            record => !hasId(record) || record.id !== id
        ) as SecondBrainData[CollectionName]

        this.commit({ ...data, [collection]: next })
    }

    replace<K extends CollectionName>(collection: K, records: SecondBrainData[K]): void {
        this.commit({ ...this.read(), [collection]: records })
    }

    reset(): SecondBrainData {
        const seeded = this.seedFactory()
        this.commit(seeded)
        return seeded
    }

    // ─── Plumbing ────────────────────────────────────────────────────────────

    private commit(data: SecondBrainData): void {
        // In-memory first and synchronously: subscribers must see the new value on
        // the very next render, so typing never lags behind the keystroke.
        this.cache = data
        this.emit()
        this.schedulePersist()
    }

    /**
     * Coalesce writes to storage.
     *
     * Persisting inside `commit` meant every keystroke in the journal serialised
     * the entire store — all twenty-one collections — and wrote it synchronously
     * on the main thread. That is fine at seed size and quietly becomes jank once
     * a year of habit entries has accumulated behind it.
     *
     * Delay is deliberately short: long enough that a burst of typing collapses
     * into one write, short enough that any pause already has the data on disk.
     */
    private schedulePersist(): void {
        if (typeof window === 'undefined' || this.pendingWrite !== null) return

        this.pendingWrite = window.setTimeout(() => {
            this.pendingWrite = null
            this.persist()
        }, PERSIST_DELAY_MS)

        // A scheduled write that never runs is data loss, and neither a closing
        // tab nor a backgrounded phone is guaranteed to run a timer. `pagehide`
        // is the one lifecycle event that fires reliably in both cases —
        // `beforeunload` does not fire on mobile Safari at all.
        if (!this.flushBound) {
            this.flushBound = true
            const flush = () => this.flush()
            window.addEventListener('pagehide', flush)
            document.addEventListener('visibilitychange', () => {
                if (document.visibilityState === 'hidden') flush()
            })
        }
    }

    /** Write immediately, cancelling any pending scheduled write. */
    private flush(): void {
        if (this.pendingWrite === null) return

        window.clearTimeout(this.pendingWrite)
        this.pendingWrite = null
        this.persist()
    }

    private persist(data: SecondBrainData = this.cache ?? emptyData()): void {
        if (typeof window === 'undefined') return

        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
        } catch {
            // Quota exceeded or storage blocked. The session still works from the
            // in-memory cache; it just won't survive a reload. Not worth
            // interrupting the user over.
        }
    }

    subscribe(listener: () => void): () => void {
        this.listeners.add(listener)

        // Keep multiple tabs in agreement.
        const onStorage = (event: StorageEvent) => {
            if (event.key !== null && event.key !== STORAGE_KEY) return

            // Drop our own pending write. It holds the pre-event snapshot, so
            // letting it fire would clobber the other tab's change with stale
            // data — the classic last-writer-wins bug that only shows up when
            // two tabs are open.
            if (this.pendingWrite !== null) {
                window.clearTimeout(this.pendingWrite)
                this.pendingWrite = null
            }

            this.cache = null
            this.emit()
        }

        window.addEventListener('storage', onStorage)

        return () => {
            this.listeners.delete(listener)
            window.removeEventListener('storage', onStorage)
        }
    }

    private emit(): void {
        for (const listener of this.listeners) listener()
    }
}

/** Collision-resistant id without adding a dependency. */
export function createId(prefix: string): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return `${prefix}_${crypto.randomUUID()}`
    }
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}
