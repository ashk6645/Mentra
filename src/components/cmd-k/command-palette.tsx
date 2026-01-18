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
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
    CommandShortcut,
} from "@/components/ui/command"
import { Project, Task } from "@prisma/client"
import { searchTasks } from "@/lib/actions/tasks"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

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

    // Expose open state to parent
    React.useEffect(() => {
        if (typeof window !== 'undefined') {
            (window as any).__openCommandPalette = () => handleOpenChange(true)
        }
    }, [])

    return (
        <>
            <CommandDialog open={open} onOpenChange={handleOpenChange} shouldFilter={false}>
                <CommandInput
                    placeholder="Type a command or search tasks..."
                    value={query}
                    onValueChange={setQuery}
                />
                <CommandList>
                    {/* Custom Empty State */}
                    {query && tasks.length === 0 && filteredProjects.length === 0 && mainNav.length === 0 && themes.length === 0 && !isSearching && (
                        <CommandEmpty>No results found.</CommandEmpty>
                    )}

                    {/* Tasks Results */}
                    {tasks.length > 0 && (
                        <CommandGroup heading="Tasks">
                            {tasks.map(task => (
                                <CommandItem key={task.id} onSelect={() => runCommand(() => router.push(`/projects/${task.projectId || 'inbox'}?taskId=${task.id}`))}>
                                    <div className={cn("mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary", task.completed ? "bg-primary text-primary-foreground" : "opacity-50")} />
                                    <span className="truncate flex-1">{task.title}</span>
                                    {task.project && (
                                        <span className="ml-2 text-xs text-muted-foreground">{task.project.name}</span>
                                    )}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}

                    {tasks.length > 0 && (filteredProjects.length > 0 || mainNav.length > 0) && <CommandSeparator />}

                    {/* Navigation */}
                    {mainNav.length > 0 && (
                        <CommandGroup heading="Suggestions">
                            {mainNav.map(item => (
                                <CommandItem key={item.name} onSelect={() => runCommand(() => router.push(item.route))}>
                                    <item.icon className="mr-2 h-4 w-4" />
                                    <span>{item.name}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}

                    {/* Projects */}
                    {filteredProjects.length > 0 && (
                        <>
                            <CommandSeparator />
                            <CommandGroup heading="Projects">
                                {filteredProjects.map(project => (
                                    <CommandItem key={project.id} onSelect={() => runCommand(() => router.push(`/projects/${project.id}`))}>
                                        <Home className="mr-2 h-4 w-4" />
                                        <span>{project.name}</span>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </>
                    )}

                    {/* Themes */}
                    {themes.length > 0 && (
                        <>
                            <CommandSeparator />
                            <CommandGroup heading="Theme">
                                {themes.map(item => (
                                    <CommandItem key={item.name} onSelect={() => runCommand(() => setTheme(item.value))}>
                                        <item.icon className="mr-2 h-4 w-4" />
                                        <span>{item.name}</span>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </>
                    )}

                </CommandList>
            </CommandDialog>
        </>
    )
}
