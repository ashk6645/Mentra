import { arrayMove } from '@dnd-kit/sortable'

/**
 * The list's drag-and-drop arithmetic, kept pure so it can be tested without a
 * pointer. An `Order` maps each container (a section, or the no-section area)
 * to its task ids, top to bottom.
 */

export type Order = Record<string, string[]>

const CONTAINER_PREFIX = 'container:'

/** Which container an id belongs to: a container's own drop id, or the list holding a task. */
export function findContainer(id: string, order: Order): string | undefined {
    if (id.startsWith(CONTAINER_PREFIX)) return id.slice(CONTAINER_PREFIX.length)
    return Object.keys(order).find(key => order[key].includes(id))
}

/**
 * While dragging: when the pointer crosses into another container, move the task
 * there — just above the task it's over, or to the end when over the container
 * itself — so the gap opens where it will land. Same container: unchanged.
 */
export function moveAcross(order: Order, activeId: string, overId: string): Order {
    const from = findContainer(activeId, order)
    const to = findContainer(overId, order)
    if (!from || !to || from === to) return order

    const target = order[to]
    const index = overId.startsWith(CONTAINER_PREFIX) ? target.length : Math.max(0, target.indexOf(overId))

    return {
        ...order,
        [from]: order[from].filter(id => id !== activeId),
        [to]: [...target.slice(0, index), activeId, ...target.slice(index)],
    }
}

/**
 * On drop: the container the task ends in and its final order — or `null` when
 * the drop changed nothing, so nothing is saved.
 */
export function settleDrop(
    order: Order,
    original: Order,
    startedIn: string,
    activeId: string,
    overId: string
): { container: string; ids: string[]; moved: boolean } | null {
    const container = findContainer(activeId, order)
    if (!container) return null

    let ids = order[container]
    if (!overId.startsWith(CONTAINER_PREFIX) && ids.includes(overId) && overId !== activeId) {
        ids = arrayMove(ids, ids.indexOf(activeId), ids.indexOf(overId))
    }

    const moved = container !== startedIn
    const same = !moved && ids.length === original[container]?.length && ids.every((id, i) => original[container][i] === id)
    return same ? null : { container, ids, moved }
}
