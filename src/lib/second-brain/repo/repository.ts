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
 * The interface is deliberately collection-oriented rather than one method per
 * entity type. Twenty-one collections × four verbs would be eighty-four methods to
 * keep in sync across two implementations; this is four, and a new domain costs a
 * type rather than an interface change.
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
     * Collections whose records lack an `id` (habit entries, routine step entries)
     * are keyed by their natural composite key instead — see `replace`.
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
     * The escape hatch for the two join-table-ish collections that have no `id`,
     * and for bulk operations (seeding, reordering) where a read-modify-write of
     * the whole array is genuinely simpler and no less correct than N updates.
     */
    replace<K extends CollectionName>(collection: K, records: SecondBrainData[K]): void

    /** Wipe and re-seed. Backs the "Reset demo" action. */
    reset(): SecondBrainData

    /** Notify on any mutation. Returns an unsubscribe function. */
    subscribe(listener: () => void): () => void
}

/** Narrow a collection member to something with an id, for the generic update path. */
export function hasId(record: unknown): record is Entity {
    return typeof record === 'object' && record !== null && 'id' in record
}
