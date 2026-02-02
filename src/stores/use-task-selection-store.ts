import { create } from 'zustand'

interface TaskSelectionStore {
    selectedIds: Set<string>
    toggleSelection: (id: string) => void
    clearSelection: () => void
    selectAll: (ids: string[]) => void
    selectedCount: () => number
}

export const useTaskSelectionStore = create<TaskSelectionStore>((set, get) => ({
    selectedIds: new Set(),
    toggleSelection: (id) =>
        set((state) => {
            const newSelected = new Set(state.selectedIds)
            if (newSelected.has(id)) {
                newSelected.delete(id)
            } else {
                newSelected.add(id)
            }
            return { selectedIds: newSelected }
        }),
    clearSelection: () => set({ selectedIds: new Set() }),
    selectAll: (ids) => set({ selectedIds: new Set(ids) }),
    selectedCount: () => get().selectedIds.size,
}))
