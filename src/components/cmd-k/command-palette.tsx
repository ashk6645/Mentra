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
    Search,
    FolderKanban
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
import { searchTasks } from "@/lib/actions/tasks"
import { getProjects } from "@/lib/actions/projects"
import { cn } from "@/lib/utils"
import { useTaskDetailStore } from "@/stores/use-task-detail-store"
import { SecondBrainCommands, SECOND_BRAIN_SECTIONS } from "./second-brain-commands"

interface Project {
    id: string
    name: string
    icon: string | null
    color: string
    taskCount?: number
}

export function CommandPalette({ onOpenChange }: { onOpenChange?: (open: boolean) => void }) {
    const [open, setOpen] = React.useState(false)
    const router = useRouter()
    const { setTheme } = useTheme()
    const [query, setQuery] = React.useState("")
    const { selectTask } = useTaskDetailStore()

    const [tasks, setTasks] = React.useState<any[]>([])
    const [isSearching, setIsSearching] = React.useState(false)
    const [projects, setProjects] = React.useState<Project[]>([])

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
                const result = await searchTasks(query)
                setTasks(result.success ? result.data : [])
            } catch (error) {
                console.error("Search error", error)
            } finally {
                setIsSearching(false)
            }
        }, 300)

        return () => clearTimeout(timer)
    }, [query])

    // Fetch projects on mount
    React.useEffect(() => {
        async function fetchProjects() {
            try {
                const result = await getProjects()
                if (result.success && result.data) {
                    setProjects(result.data)
                }
            } catch (error) {
                console.error('Failed to fetch projects', error)
            }
        }
        fetchProjects()
    }, [])

    const runCommand = React.useCallback((command: () => unknown) => {
        handleOpenChange(false)
        command()
    }, [])

    // Manual filtering for static items
    const filterStatic = (item: string) => {
        if (!query) return true
        return item.toLowerCase().includes(query.toLowerCase())
    }


    const mainNav = [
        { name: "Today", icon: CalendarIcon, route: "/today" },
        { name: "Upcoming", icon: Rocket, route: "/upcoming" },
    ].filter(item => filterStatic(item.name))

    const filteredProjects = projects.filter(project =>
        filterStatic(project.name)
    )

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
                    {/*
                      * Empty state.
                      *
                      * `shouldFilter` is off, so cmdk cannot count matches for us and
                      * this has to be asked directly. The length check covers Second
                      * Brain: from three characters on it always offers to capture the
                      * query as an idea, so there is never genuinely nothing to show.
                      */}
                    {query && !isSearching &&
                        query.trim().length < 3 &&
                        tasks.length === 0 &&
                        mainNav.length === 0 &&
                        themes.length === 0 &&
                        filteredProjects.length === 0 &&
                        !SECOND_BRAIN_SECTIONS.some(s => s.label.toLowerCase().includes(query.trim().toLowerCase())) && (
                            <CommandEmpty>No results found.</CommandEmpty>
                        )}

                    {/* Tasks Results */}
                    {tasks.length > 0 && (
                        <CommandGroup heading="Tasks">
                            {tasks.map(task => (
                                <CommandItem key={task.id} onSelect={() => runCommand(() => selectTask(task.id, task))}>
                                    <div className={cn("mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary", task.completed ? "bg-primary text-primary-foreground" : "opacity-50")} />
                                    <span className="truncate flex-1">{task.title}</span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    )}

                    {tasks.length > 0 && mainNav.length > 0 && <CommandSeparator />}

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
                            {(tasks.length > 0 || mainNav.length > 0) && <CommandSeparator />}
                            <CommandGroup heading="Projects">
                                {filteredProjects.map(project => (
                                    <CommandItem
                                        key={project.id}
                                        onSelect={() => runCommand(() => router.push(`/projects/${project.id}`))}
                                    >
                                        <FolderKanban className="mr-2 h-4 w-4" />
                                        <span className="mr-2">{project.icon || '📁'}</span>
                                        <span className="truncate flex-1">{project.name}</span>
                                        {project.taskCount !== undefined && project.taskCount > 0 && (
                                            <span className="text-xs text-muted-foreground">
                                                {project.taskCount}
                                            </span>
                                        )}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </>
                    )}



                    {/* Second Brain — search, sections and quick capture.
                        Mounted only while the dialog is open, so the store
                        subscription does not outlive it. */}
                    <SecondBrainCommands query={query} run={runCommand} />

                    {/* Themes */}
                    {themes.length > 0 && (
                        <>
                            <CommandSeparator />
                            <CommandGroup heading="Theme">
                                {themes.map(item => (
                                    <CommandItem
                                        key={item.name}
                                        value={item.value}
                                        onSelect={() => runCommand(() => setTheme(item.value))}
                                    >
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
