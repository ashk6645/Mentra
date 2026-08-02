'use client'

import { useCallback, useSyncExternalStore } from 'react'
import { emptyData, type SecondBrainData, type CollectionName } from '../domain/types'
import type { SecondBrainRepository } from './repository'
import { LocalRepository, createId } from './local-repository'
import { seedData } from './seed'

/**
 * The single repository instance, and the hook every component reads through.
 *
 * Swapping persistence later is a one-line change here:
 *
 *     const repository = new ApiRepository(fetchClient)
 *
 * Nothing else in the feature names a storage mechanism.
 */
export const repository: SecondBrainRepository = new LocalRepository(seedData)

/**
 * Subscribe to the store.
 *
 * `useSyncExternalStore` rather than state + effect: reading storage into state
 * from an effect causes a cascading render on every mount (which the React
 * Compiler flags), and it needs a manual guard so the first write doesn't clobber
 * what was just read. This handles the server/client snapshot split natively.
 */
const subscribe = (listener: () => void) => repository.subscribe(listener)
const getSnapshot = () => repository.read()

/**
 * Hydration snapshot.
 *
 * Must be the *same value* on the server and during the client's hydration pass,
 * so it is a stable empty store rather than a read of the repository. An earlier
 * version captured `repository.read()` at module load, which on the client is the
 * real localStorage data — so the server rendered a score of 0, the client
 * hydrated with 16, and React threw a hydration mismatch.
 *
 * React re-renders with `getSnapshot` immediately after hydration, so the real
 * data appears on the next frame.
 */
const EMPTY_SNAPSHOT = emptyData()
const getServerSnapshot = () => EMPTY_SNAPSHOT

/**
 * False during SSR and the hydration pass, true afterwards.
 *
 * Screens use this to render a skeleton rather than flashing an empty store as
 * though it were real data (spec §38).
 */
export function useStoreReady(): boolean {
    return useSyncExternalStore(
        subscribe,
        () => true,
        () => false
    )
}

export function useSecondBrainData(): SecondBrainData {
    return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

/**
 * Mutations, bound to the repository.
 *
 * Returned from a hook rather than imported directly so components have one
 * obvious seam, and so a future implementation can make these async without
 * changing any call site.
 */
export function useSecondBrainActions() {
    const create = useCallback(
        <K extends CollectionName>(collection: K, record: SecondBrainData[K][number]) =>
            repository.create(collection, record),
        []
    )

    const update = useCallback(
        <K extends CollectionName>(
            collection: K,
            id: string,
            patch: Partial<SecondBrainData[K][number]>
        ) => repository.update(collection, id, patch),
        []
    )

    const remove = useCallback(
        (collection: CollectionName, id: string) => repository.remove(collection, id),
        []
    )

    const replace = useCallback(
        <K extends CollectionName>(collection: K, records: SecondBrainData[K]) =>
            repository.replace(collection, records),
        []
    )

    const reset = useCallback(() => repository.reset(), [])

    /**
     * Empty every collection.
     *
     * Distinct from `reset`, which reseeds with demo data. Someone who has just
     * been told the month of history in front of them is fabricated needs a way
     * to get to a genuinely blank store, and reseeding is the opposite of that.
     */
    const clearAll = useCallback(() => {
        for (const collection of Object.keys(emptyData()) as CollectionName[]) {
            repository.replace(collection, [] as never)
        }
    }, [])

    return { create, update, remove, replace, reset, clearAll }
}

export { createId }
export type { SecondBrainRepository }
