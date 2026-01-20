"use client"

import * as React from "react"
import {
    CalendarIcon,
    Home,
    Laptop,
    Moon,
    Plus,
    Rocket,
    Settings,
    Sun,
    User,
    CheckSquare,
    Layout,
    Search
} from "lucide-react"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"

import {
    SearchCommand,
    SearchInput,
    SearchList,
    SearchEmpty,
    SearchGroup,
    SearchItem,
    SearchSeparator,
    SearchShortcut,
} from "@/components/ui/search-command"
import { Project, Task } from "@prisma/client"
import { searchTasks } from "@/lib/actions/tasks"
import { cn } from "@/lib/utils"

export function CommandPalette({ projects, onOpenChange }: { projects: Project[], onOpenChange?: (open: boolean) => void }) {
    const [open, setOpen] = React.useState(false)
    const router = useRouter()
    const { setTheme } = useTheme()
    const [query, setQuery] = React.useState("")
    const [tasks, setTasks] = React.useState<(Task & { project?: Project | null })[]>([])
    const [isSearching, setIsSearching] = React.useState(false)

    const handleOpenChange = (newOpen: boolean) => {
        setOpen(newOpen)
        onOpenChange?.(newOpen)
        // Reset query when closing
        if (!newOpen) {
            setQuery("")
            setTasks([])
        }
    }

    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                handleOpenChange(!open)
            }
        }

        document.addEventListener("keydown", down)
        return () => document.removeEventListener("keydown", down)
    }, [open])

    // Debounced search
    React.useEffect(() => {
        if (query.length < 2) {
            setTasks([])
            setIsSearching(false)
            return
        }

        setIsSearching(true)
        const timer = setTimeout(async () => {
            try {
                const results = await searchTasks(query)
                setTasks(results)
            } catch (error) {
                console.error("Search error", error)
            } finally {
                setIsSearching(false)
            }
        }, 300)

        return () => clearTimeout(timer)
    }, [query])

    const runCommand = React.useCallback((command: () => unknown) => {
        handleOpenChange(false)
        command()
    }, [])

    // Manual filtering for static items
    const filterStatic = (item: string) => {
        if (!query) return true
        return item.toLowerCase().includes(query.toLowerCase())
    }

    const filteredProjects = projects.filter(p => filterStatic(p.name))
    const mainNav = [
        { name: "Dashboard", icon: Layout, route: "/dashboard" },
        { name: "All Tasks", icon: CheckSquare, route: "/tasks" },
        { name: "Today", icon: CalendarIcon, route: "/today" },
        { name: "Upcoming", icon: Rocket, route: "/upcoming" },
    ].filter(item => filterStatic(item.name))

    const themes = [
        { name: "Light", icon: Sun, value: "light" },
        { name: "Dark", icon: Moon, value: "dark" },
        { name: "System", icon: Laptop, value: "system" },
    ].filter(item => filterStatic(item.name))

    // Flatten all items for keyboard navigation validation
    const allItems = React.useMemo(() => [
        ...tasks.map(t => ({ type: 'task', data: t, action: () => runCommand(() => router.push(`/projects/${t.projectId || 'inbox'}?taskId=${t.id}`)) })),
        ...mainNav.map(n => ({ type: 'nav', data: n, action: () => runCommand(() => router.push(n.route)) })),
        ...filteredProjects.map(p => ({ type: 'project', data: p, action: () => runCommand(() => router.push(`/projects/${p.id}`)) })),
        ...themes.map(t => ({ type: 'theme', data: t, action: () => runCommand(() => setTheme(t.value)) }))
    ], [tasks, mainNav, filteredProjects, themes, router, runCommand, setTheme])

    const [selectedIndex, setSelectedIndex] = React.useState(0)

    // Reset selection when query or results change
    React.useEffect(() => {
        setSelectedIndex(0)
    }, [query, allItems.length])

    // Keyboard navigation
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!open || allItems.length === 0) return

            if (e.key === 'ArrowDown') {
                e.preventDefault()
                setSelectedIndex(prev => (prev + 1) % allItems.length)
            } else if (e.key === 'ArrowUp') {
                e.preventDefault()
                setSelectedIndex(prev => (prev - 1 + allItems.length) % allItems.length)
            } else if (e.key === 'Enter') {
                e.preventDefault()
                allItems[selectedIndex]?.action()
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [open, allItems, selectedIndex])

    // Scroll selected item into view
    const selectedItemRef = React.useRef<HTMLDivElement>(null)
    React.useEffect(() => {
        selectedItemRef.current?.scrollIntoView({ block: 'nearest' })
    }, [selectedIndex])

    // Expose open state to parent
    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            (window as any).__openCommandPalette = () => handleOpenChange(true)
        }
    }, [])

    const hasResults = allItems.length > 0

    // Helper to track global index during rendering
    let globalIndex = 0

    return (
        <SearchCommand open={open} onOpenChange={handleOpenChange}>
            <SearchInput
                placeholder="Type a command or search tasks..."
                value={query}
                onValueChange={setQuery}
            />
            <SearchList>
                {/* Custom Empty State */}
                {query && !hasResults && !isSearching && (
                    <SearchEmpty>No results found.</SearchEmpty>
                )}

                {isSearching && (
                    <SearchEmpty>Searching...</SearchEmpty>
                )}

                {/* Tasks Results */}
                {tasks.length > 0 && (
                    <SearchGroup heading="Tasks">
                        {tasks.map((task, i) => {
                            const index = globalIndex++
                            const isSelected = index === selectedIndex
                            return (
                                <SearchItem
                                    key={task.id}
                                    ref={isSelected ? selectedItemRef : undefined}
                                    selected={isSelected}
                                    onSelect={() => runCommand(() => router.push(`/projects/${task.projectId || 'inbox'}?taskId=${task.id}`))}
                                >
                                    <div className={cn("mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary", task.completed ? "bg-primary text-primary-foreground" : "opacity-50")} />
                                    <span className="truncate flex-1">{task.title}</span>
                                    {task.project && (
                                        <span className="ml-2 text-xs text-muted-foreground">{task.project.name}</span>
                                    )}
                                </SearchItem>
                            )
                        })}
                    </SearchGroup>
                )}

                {tasks.length > 0 && (filteredProjects.length > 0 || mainNav.length > 0) && <SearchSeparator />}

                {/* Navigation */}
                {mainNav.length > 0 && (
                    <SearchGroup heading="Suggestions">
                        {mainNav.map((item, i) => {
                            const index = globalIndex++
                            const isSelected = index === selectedIndex
                            return (
                                <SearchItem
                                    key={item.name}
                                    ref={isSelected ? selectedItemRef : undefined}
                                    selected={isSelected}
                                    onSelect={() => runCommand(() => router.push(item.route))}
                                >
                                    <item.icon className="mr-2 h-4 w-4" />
                                    <span>{item.name}</span>
                                </SearchItem>
                            )
                        })}
                    </SearchGroup>
                )}

                {/* Projects */}
                {filteredProjects.length > 0 && (
                    <>
                        <SearchSeparator />
                        <SearchGroup heading="Projects">
                            {filteredProjects.map((project, i) => {
                                const index = globalIndex++
                                const isSelected = index === selectedIndex
                                return (
                                    <SearchItem
                                        key={project.id}
                                        ref={isSelected ? selectedItemRef : undefined}
                                        selected={isSelected}
                                        onSelect={() => runCommand(() => router.push(`/projects/${project.id}`))}
                                    >
                                        <Home className="mr-2 h-4 w-4" />
                                        <span>{project.name}</span>
                                    </SearchItem>
                                )
                            })}
                        </SearchGroup>
                    </>
                )}

                {/* Themes */}
                {themes.length > 0 && (
                    <>
                        <SearchSeparator />
                        <SearchGroup heading="Theme">
                            {themes.map((item, i) => {
                                const index = globalIndex++
                                const isSelected = index === selectedIndex
                                return (
                                    <SearchItem
                                        key={item.name}
                                        ref={isSelected ? selectedItemRef : undefined}
                                        selected={isSelected}
                                        onSelect={() => runCommand(() => setTheme(item.value))}
                                    >
                                        <item.icon className="mr-2 h-4 w-4" />
                                        <span>{item.name}</span>
                                    </SearchItem>
                                )
                            })}
                        </SearchGroup>
                    </>
                )}

            </SearchList>
        </SearchCommand>
    )
}
