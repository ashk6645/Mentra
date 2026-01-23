import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UIState {
    isSidebarOpen: boolean
    isSidebarCollapsed: boolean
    toggleSidebar: () => void
    closeSidebar: () => void
    openSidebar: () => void
    toggleSidebarCollapsed: () => void
}

export const useUIStore = create<UIState>()(
    persist(
        (set) => ({
            isSidebarOpen: true,
            isSidebarCollapsed: false,
            toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
            closeSidebar: () => set({ isSidebarOpen: false }),
            openSidebar: () => set({ isSidebarOpen: true }),
            toggleSidebarCollapsed: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
        }),
        {
            name: 'ui-storage',
            partialize: (state) => ({ isSidebarCollapsed: state.isSidebarCollapsed }),
        }
    )
)

