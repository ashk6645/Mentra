'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
    LayoutDashboard,
    CheckSquare,
    Calendar,
    Inbox,
    Settings,
    LogOut,
    User as UserIcon,
    Menu,
    Sun,
    CalendarDays,
    LayoutGrid,
    Timer,
    Target,
    ChevronRight,
    Plus,
    Search
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Project } from '@prisma/client'
import { CreateProjectDialog } from '@/components/projects/create-project-dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { motion, AnimatePresence } from 'framer-motion'
import { useUIStore } from '@/stores/use-ui-store'
import { PanelLeftClose } from 'lucide-react'

interface PageItem {
    id: string
    title: string
    icon: string | null
    parentPageId: string | null
    isFavorited: boolean
}

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    projects: Project[]
    pages?: PageItem[]
    user: any
    onOpenCommand?: () => void
}

export function Sidebar({ className, projects, pages = [], user, onOpenCommand }: SidebarProps) {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()
    const { isSidebarCollapsed, toggleSidebarCollapsed } = useUIStore()

    const [profile, setProfile] = useState<any>(null)
    const [projectsExpanded, setProjectsExpanded] = useState(true)
    const [pagesExpanded, setPagesExpanded] = useState(true)
    const [showCreateDialog, setShowCreateDialog] = useState(false)

    // Reset expanded states when sidebar collapses to keep UI clean
    useEffect(() => {
        if (isSidebarCollapsed) {
            setProjectsExpanded(false)
            setPagesExpanded(false)
        }
    }, [isSidebarCollapsed])

    useEffect(() => {
        if (user?.id) {
            fetchProfile()
        }
    }, [user?.id])

    async function fetchProfile() {
        try {
            const { data } = await supabase
                .from('profiles')
                .select('display_name, avatar_url')
                .eq('id', user?.id)
                .single()

            if (data) {
                // If avatar_url contains base64 data, ignore it
                if (data.avatar_url && data.avatar_url.startsWith('data:image')) {
                    data.avatar_url = null
                }
                setProfile(data)
            }
        } catch (error) {
            console.error('Error fetching profile:', error)
        }
    }

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    const displayName = profile?.display_name || user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'User'
    const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url

    const routes = [
        { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
        { label: 'Inbox', icon: Inbox, href: '/inbox' },
        { label: 'Today', icon: Sun, href: '/today' },
        { label: 'Upcoming', icon: CalendarDays, href: '/upcoming' },
        { label: 'Calendar', icon: Calendar, href: '/calendar' },
        { label: 'My Tasks', icon: CheckSquare, href: '/tasks' },
        { label: 'Areas', icon: LayoutGrid, href: '/areas' },
        { label: 'Focus', icon: Timer, href: '/focus' },
        { label: 'Habits', icon: Target, href: '/habits' },
    ]

    const SidebarContent = () => (
        <div className="group flex flex-col h-full bg-sidebar/50 backdrop-blur-xl border-r border-sidebar-border supports-[backdrop-filter]:bg-sidebar/20">
            {/* Header / Logo Area */}
            <div className={cn("flex flex-col gap-4 transition-all duration-300", isSidebarCollapsed ? "px-2 py-4" : "px-4 py-6")}>
                <div className={cn("flex items-center", isSidebarCollapsed ? "justify-center flex-col gap-2" : "justify-between px-2")}>
                    {/* Logo */}
                    <div className={cn("flex items-center gap-2 transition-all duration-300", isSidebarCollapsed ? "justify-center" : "")}>
                        <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center shrink-0 shadow-sm">
                            <CheckSquare className="h-4 w-4 text-primary-foreground" />
                        </div>
                        {!isSidebarCollapsed && (
                            <motion.span
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="text-lg font-semibold tracking-tight text-foreground whitespace-nowrap"
                            >
                                TaskFlow
                            </motion.span>
                        )}
                    </div>

                    {/* Toggle Button */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleSidebarCollapsed}
                        className={cn(
                            "text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all duration-300",
                            isSidebarCollapsed ? "h-8 w-8 mt-2" : "h-7 w-7 opacity-0 group-hover:opacity-100"
                        )}
                    >
                        <PanelLeftClose
                            className={cn(
                                "h-4 w-4 transition-transform duration-300",
                                isSidebarCollapsed && "rotate-180"
                            )}
                        />
                        <span className="sr-only">Toggle Sidebar</span>
                    </Button>
                </div>

                {/* Search Trigger */}
                <Button
                    variant="outline"
                    className={cn(
                        "text-muted-foreground bg-background/50 border-input/50 hover:bg-accent/50 hover:text-accent-foreground shadow-sm h-9 px-2 transition-all duration-300",
                        isSidebarCollapsed ? "justify-center w-9 p-0 mx-auto" : "w-full justify-start"
                    )}
                    onClick={onOpenCommand}
                >
                    <Search className={cn("h-4 w-4 opacity-50", !isSidebarCollapsed && "mr-2")} />
                    {!isSidebarCollapsed && (
                        <>
                            <span className="text-sm font-normal">Search...</span>
                            <kbd className="pointer-events-none ml-auto h-5 select-none items-center gap-1 rounded bg-muted/50 px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 flex">
                                <span className="text-xs">⌘</span>K
                            </kbd>
                        </>
                    )}
                </Button>
            </div>


            {/* Main Navigation */}
            <div className="px-3 flex-1 overflow-y-auto no-scrollbar">
                <div className="space-y-1 mb-6">
                    {routes.map((route) => {
                        const isActive = pathname === route.href
                        return (
                            <Link
                                key={route.href}
                                href={route.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 group relative",
                                    isActive
                                        ? "text-primary bg-primary/10"
                                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                                    isSidebarCollapsed && "justify-center px-2"
                                )}
                            >
                                <route.icon className={cn(
                                    "h-4 w-4 transition-colors shrink-0",
                                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                                )} />
                                {!isSidebarCollapsed && (
                                    <motion.span
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="whitespace-nowrap"
                                    >
                                        {route.label}
                                    </motion.span>
                                )}
                                {isActive && (
                                    <motion.div
                                        layoutId="sidebar-active-indicator"
                                        className="absolute left-0 w-1 h-3/5 bg-primary rounded-r-full"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                    />
                                )}
                            </Link>
                        )
                    })}
                </div>

                {/* Projects Section */}
                {!isSidebarCollapsed && (
                    <div className="px-3 mb-2">
                        <div className="flex items-center justify-between group mb-2">
                            <button
                                onClick={() => setProjectsExpanded(!projectsExpanded)}
                                className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
                            >
                                <motion.div
                                    animate={{ rotate: projectsExpanded ? 90 : 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <ChevronRight className="h-3 w-3" />
                                </motion.div>
                                Projects
                            </button>
                            <button
                                onClick={() => setShowCreateDialog(true)}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-accent rounded-sm transition-all duration-200"
                            >
                                <Plus className="h-3 w-3 text-muted-foreground" />
                            </button>
                        </div>

                        <AnimatePresence initial={false}>
                            {projectsExpanded && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: "circOut" }}
                                    className="space-y-0.5 overflow-hidden pl-2"
                                >
                                    {projects.map((project, index) => (
                                        <motion.div
                                            key={project.id}
                                            initial={{ x: -10, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            transition={{ delay: index * 0.05 }}
                                        >
                                            <Link
                                                href={`/projects/${project.id}`}
                                                className={cn(
                                                    "flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors",
                                                    pathname === `/projects/${project.id}`
                                                        ? "text-foreground bg-accent/60 font-medium"
                                                        : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
                                                )}
                                            >
                                                <span className={cn(
                                                    "h-2 w-2 rounded-full ring-1 ring-white/10",
                                                    project.color === 'red' && "bg-red-500",
                                                    project.color === 'blue' && "bg-blue-500",
                                                    project.color === 'green' && "bg-green-500",
                                                    project.color === 'purple' && "bg-purple-500",
                                                    project.color === 'orange' && "bg-orange-500",
                                                    (!project.color || project.color === 'neutral') && "bg-zinc-400"
                                                )} />
                                                <span className="truncate">{project.name}</span>
                                            </Link>
                                        </motion.div>
                                    ))}
                                    {projects.length === 0 && (
                                        <div className="px-3 py-2 text-xs text-muted-foreground italic">
                                            No projects yet
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}

                {/* Private Pages Section */}
                {!isSidebarCollapsed && (
                    <div className="px-3 mb-2">
                        <div className="flex items-center justify-between group mb-2">
                            <button
                                onClick={() => setPagesExpanded(!pagesExpanded)}
                                className="flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
                            >
                                <motion.div
                                    animate={{ rotate: pagesExpanded ? 90 : 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <ChevronRight className="h-3 w-3" />
                                </motion.div>
                                Private
                            </button>
                            <Link
                                href="/private/new"
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-accent rounded-sm transition-all duration-200"
                            >
                                <Plus className="h-3 w-3 text-muted-foreground" />
                            </Link>
                        </div>

                        <AnimatePresence initial={false}>
                            {pagesExpanded && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: "circOut" }}
                                    className="space-y-0.5 overflow-hidden pl-2"
                                >
                                    {pages.map((page, index) => (
                                        <motion.div
                                            key={page.id}
                                            initial={{ x: -10, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            transition={{ delay: index * 0.05 }}
                                        >
                                            <Link
                                                href={`/private/${page.id}`}
                                                className={cn(
                                                    "flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors",
                                                    pathname === `/private/${page.id}`
                                                        ? "text-foreground bg-accent/60 font-medium"
                                                        : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
                                                )}
                                            >
                                                <span className="text-base">{page.icon || '📄'}</span>
                                                <span className="truncate">{page.title}</span>
                                            </Link>
                                        </motion.div>
                                    ))}
                                    {pages.length === 0 && (
                                        <Link
                                            href="/private/new"
                                            className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            <Plus className="h-3 w-3" />
                                            <span>New page</span>
                                        </Link>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            <CreateProjectDialog
                open={showCreateDialog}
                onOpenChange={setShowCreateDialog}
            />

            {/* Footer / Profile */}
            <div className="p-3 border-t border-sidebar-border bg-sidebar/50">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="ghost"
                            className={cn(
                                "w-full justify-start hover:bg-accent/50 group",
                                isSidebarCollapsed ? "px-0 justify-center h-10 w-10" : "px-2 py-6"
                            )}
                        >
                            <Avatar className={cn(
                                "border border-border/50 shadow-sm transition-transform group-hover:scale-105",
                                isSidebarCollapsed ? "h-8 w-8" : "h-8 w-8 mr-3"
                            )}>
                                <AvatarImage src={avatarUrl} />
                                <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                                    {displayName?.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            {!isSidebarCollapsed && (
                                <div className="flex flex-col items-start min-w-0">
                                    <span className="text-sm font-medium truncate text-foreground/90 top-0">
                                        {displayName}
                                    </span>
                                    <span className="text-xs text-muted-foreground truncate font-normal">
                                        {user?.email}
                                    </span>
                                </div>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent
                        className="w-56 p-1 mb-2 bg-popover/95 backdrop-blur-xl border-border/50 shadow-xl"
                        align="start"
                        side="right"
                        sideOffset={12}
                    >
                        <div className="space-y-0.5">
                            <Link href="/profile">
                                <Button variant="ghost" className="w-full justify-start h-8 px-2 text-sm font-normal">
                                    <UserIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                                    Profile
                                </Button>
                            </Link>

                            <Separator className="my-1 bg-border/50" />
                            <Button
                                variant="ghost"
                                className="w-full justify-start h-8 px-2 text-sm font-normal text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={handleSignOut}
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                Sign Out
                            </Button>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>
        </div>
    )

    return (
        <>
            <motion.div
                className={cn("hidden md:block fixed inset-y-0 z-50", className)}
                initial={false}
                animate={{ width: isSidebarCollapsed ? 80 : 256 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
            >
                <SidebarContent />
            </motion.div>

            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden fixed top-3 left-3 z-50 bg-background/50 backdrop-blur-md border border-border/50 shadow-sm">
                        <Menu className="h-5 w-5" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-72 border-r border-border/50 bg-background/95 backdrop-blur-xl">
                    <SidebarContent />
                </SheetContent>
            </Sheet>
        </>
    )
}
