import { create } from 'zustand'

interface TaskSelectionStore {
    selectedIds: Set<string>
    isSelectionMode: boolean
    toggleSelection: (id: string) => void
    clearSelection: () => void
    selectAll: (ids: string[]) => void
    selectedCount: () => number
    setIsSelectionMode: (value: boolean) => void
}

export const useTaskSelectionStore = create<TaskSelectionStore>((set, get) => ({
    selectedIds: new Set(),
    isSelectionMode: false,
    toggleSelection: (id) =>
        set((state) => {
            const newSelected = new Set(state.selectedIds)
            if (newSelected.has(id)) {
                newSelected.delete(id)
            } else {
                newSelected.add(id)
            }

            // If we deselect the last item, should we exit selection mode?
            // The user requirement says: "if user uncheck all the boxesd after selection then as he uncheck the last box the checkbox will diappaer and comes only when select button is pressed."
            // This implies: count 0 -> exit mode IF it was triggered by unchecking.
            // But wait, if they just clicked "Select" button, count is 0, mode is ON.
            // If they then click a box, count 1. Unclick -> count 0.
            // I'll implement a separate logic in the component or here.
            // Let's strictly follow: "as he uncheck the last box the checkbox will diappaer"

            // Implementation detail: If count goes to 0 AND we were in selection mode, turn it off?
            // BUT what if I just clicked "Select" (count 0) and haven't selected anything yet? It shouldn't turn off immediately.
            // The requirement says "comes only when select button is pressed".
            // So default state: Mode OFF.
            // Click Select: Mode ON.
            // Check box: Count 1.
            // Uncheck box: Count 0. -> Should Mode turn OFF?
            // User says: "if user uncheck all the boxesd after selection then as he uncheck the last box the checkbox will diappaer"
            // So yes, if count becomes 0 from >0, turn off mode.

            const shouldTurnOff = state.selectedIds.size > 0 && newSelected.size === 0;

            return {
                selectedIds: newSelected,
                isSelectionMode: shouldTurnOff ? false : state.isSelectionMode
            }
        }),
    clearSelection: () => set({ selectedIds: new Set(), isSelectionMode: false }),
    selectAll: (ids) => set({ selectedIds: new Set(ids), isSelectionMode: true }),
    selectedCount: () => get().selectedIds.size,
    setIsSelectionMode: (value) => set({ isSelectionMode: value }),
}))
