'use client'

import { useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useTaskDetailStore } from '@/stores/use-task-detail-store'
import { toggleTaskCompletion, deleteTask } from '@/lib/actions/tasks'
import { useTheme } from 'next-themes'

export function useKeyboardShortcuts() {
    const router = useRouter()
    const pathname = usePathname()
    const { selectTask, selectedTaskId, closePanel } = useTaskDetailStore()
    const { theme, setTheme } = useTheme()

    // Helper to get all visible task elements in DOM order
    const getTaskElements = useCallback(() => {
        return Array.from(document.querySelectorAll('[data-task-id]')) as HTMLElement[]
    }, [])

    const getCurrentTaskIndex = useCallback((elements: HTMLElement[]) => {
        // First check active element
        if (document.activeElement && document.activeElement.hasAttribute('data-task-id')) {
            return elements.indexOf(document.activeElement as HTMLElement)
        }

        // Then check store
        if (selectedTaskId) {
            return elements.findIndex(el => el.getAttribute('data-task-id') === selectedTaskId)
        }

        return -1
    }, [selectedTaskId])

    const focusTask = useCallback((element: HTMLElement) => {
        element.focus()
        // Also select it in the store for sidebar info, but maybe don't open panel automatically if we just want to navigate
        // For now, let's just focus. The user said "selectNextTask", which might imply selection.
        // But "j/k" usually implies cursor movement. e opens edit.
        // Let's scroll into view smoothly
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }, [])

    useEffect(() => {
        const handler = async (e: KeyboardEvent) => {
            // Ignore if typing in input, textarea, or contentEditable
            if (
                e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement ||
                (e.target as HTMLElement).isContentEditable
            ) {
                return
            }

            // Ignore if modifiers (cmd/ctrl/alt) are pressed, EXCEPT for specific allowed ones if needed
            // The request says "single-key shortcuts", so we generally ignore modifiers
            if (e.metaKey || e.ctrlKey || e.altKey) return

            switch (e.key) {
                // Navigation
                case 't':
                    e.preventDefault()
                    router.push('/today')
                    break
                case 'u':
                    e.preventDefault()
                    router.push('/upcoming')
                    break
                case 'i':
                    e.preventDefault()
                    router.push('/inbox')
                    break
                case 'c':
                    e.preventDefault()
                    router.push('/completed')
                    break
                case 'l':
                    e.preventDefault()
                    router.push('/calendar')
                    break
                case 'f':
                    e.preventDefault()
                    router.push('/focus')
                    break

                // cmd+k is handled by command-palette component usually, 
                // but user asked for '/' to open search
                case '/':
                    e.preventDefault()
                    // Open Command Palette
                    if (typeof window !== 'undefined' && (window as any).__openCommandPalette) {
                        (window as any).__openCommandPalette()
                    }
                    break

                // Actions
                case 'n':
                    e.preventDefault()
                    if (typeof window !== 'undefined' && (window as any).__openQuickAdd) {
                        (window as any).__openQuickAdd()
                    }
                    break

                // Task Navigation (Vim style)
                case 'j': {
                    e.preventDefault()
                    const elements = getTaskElements()
                    if (elements.length === 0) return

                    const currentIndex = getCurrentTaskIndex(elements)
                    const nextIndex = currentIndex < elements.length - 1 ? currentIndex + 1 : 0
                    focusTask(elements[nextIndex])
                    break
                }

                case 'k': {
                    e.preventDefault()
                    const elements = getTaskElements()
                    if (elements.length === 0) return

                    const currentIndex = getCurrentTaskIndex(elements)
                    const prevIndex = currentIndex > 0 ? currentIndex - 1 : elements.length - 1
                    focusTask(elements[prevIndex])
                    break
                }

                // Task Actions
                case 'x': {
                    // Toggle completion of selected/focused task
                    e.preventDefault()
                    const elements = getTaskElements()
                    const currentIndex = getCurrentTaskIndex(elements)
                    if (currentIndex !== -1) {
                        const element = elements[currentIndex]
                        const taskId = element.getAttribute('data-task-id')
                        if (taskId) {
                            // Find current completion status? 
                            // We might need to check the checkbox state inside or keep track of it
                            // For now, let's assume valid ID means we can toggle. 
                            // But toggleTaskCompletion requires us to know the NEW state or it toggles?
                            // The server action signature is (id, completed). We need to know current state.
                            // We can infer it from usage of Aria-checked or similar on the checkbox inside?
                            // Or just find the checkbox input
                            const checkbox = element.querySelector('[role="checkbox"]') as HTMLButtonElement
                            if (checkbox) {
                                const isChecked = checkbox.getAttribute('aria-checked') === 'true'
                                // We want to toggle to !isChecked.
                                // But better yet, trigger the click on the checkbox to initiate the full UI flow in TaskRow
                                checkbox.click()
                            }
                        }
                    }
                    break
                }

                case 'd': {
                    e.preventDefault()
                    const elements = getTaskElements()
                    const currentIndex = getCurrentTaskIndex(elements)
                    if (currentIndex !== -1) {
                        const element = elements[currentIndex]
                        const taskId = element.getAttribute('data-task-id')
                        const title = element.querySelector('h3')?.textContent || 'Task'

                        if (taskId) {
                            // Trigger delete. 
                            // Since delete has a confirmation dialog in TaskRow, we might want to trigger that specific flow.
                            // Finding the delete button in the menu might be hard.
                            // Alternative: Confirm with system dialog or just direct call if "Single key" implies speed.
                            // User prompt "d: deleteSelectedTask"
                            if (confirm(`Delete "${title}"?`)) {
                                await deleteTask(taskId)
                                router.refresh()
                            }
                        }
                    }
                    break
                }

                case 'e': {
                    e.preventDefault()
                    const elements = getTaskElements()
                    const currentIndex = getCurrentTaskIndex(elements)
                    if (currentIndex !== -1) {
                        const element = elements[currentIndex]
                        // Simulate click to open side panel as implemented in TaskRow
                        element.click()
                    }
                    break
                }

                // Close panel with Escape if open
                case 'Escape':
                    if (selectedTaskId) {
                        closePanel()
                    }
                    else if (document.activeElement instanceof HTMLElement) {
                        document.activeElement.blur()
                    }
                    break
            }
        }

        window.addEventListener('keydown', handler)
        return () => window.removeEventListener('keydown', handler)
    }, [router, pathname, selectedTaskId, selectTask, closePanel, getTaskElements, getCurrentTaskIndex, focusTask])
}
