import type { SecondBrainData, CollectionName, Entity } from '../domain/types'

/**
 * The persistence boundary.
 *
 * Everything above this line (hooks, components) speaks only in domain objects.
 * Everything below decides where the bytes live. Today that's localStorage; later
 * it's an API. Swapping implementations must not require touching a component —
 * which is the whole reason this interface exists rather than components calling
 * `localStorage.setItem` directly.
 *
 * Collection-oriented rather than one method per entity type: a new domain costs
 * a type, not an interface change.
 */
export interface SecondBrainRepository {
    /** Full snapshot. Callers derive their own slices. */
    read(): SecondBrainData

    /** Insert one record into a collection. Returns the stored record. */
    create<K extends CollectionName>(
        collection: K,
        record: SecondBrainData[K][number]
    ): SecondBrainData[K][number]

    /**
     * Patch one record by id.
     * Entry collections have no `id` — they are keyed by habit/step and date, and
     * are written through `replace` instead.
     */
    update<K extends CollectionName>(
        collection: K,
        id: string,
        patch: Partial<SecondBrainData[K][number]>
    ): void

    remove(collection: CollectionName, id: string): void

    /**
     * Replace a whole collection.
     *
     * For the id-less entry collections, and for bulk operations (reordering, undo)
     * where writing the array back is simpler and no less correct than N updates.
     */
    replace<K extends CollectionName>(collection: K, records: SecondBrainData[K]): void

    /** Notify on any mutation. Returns an unsubscribe function. */
    subscribe(listener: () => void): () => void
}

/** Narrow a collection member to something with an id, for the generic update path. */
export function hasId(record: unknown): record is Entity {
    return typeof record === 'object' && record !== null && 'id' in record
}
