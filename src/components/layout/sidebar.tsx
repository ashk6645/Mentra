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
    Search,
    Folder
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect, memo } from 'react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Project } from '@prisma/client'
import { CreateProjectDialog } from '@/components/projects/create-project-dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { motion, AnimatePresence } from 'framer-motion'
import { useUIStore } from '@/stores/use-ui-store'
import { PanelLeftClose, MoreHorizontal, Trash2 } from 'lucide-react'
import { deleteProject, getProjects } from '@/lib/actions/projects'
import { deletePage } from '@/lib/actions/pages'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'

interface PageItem {
    id: string
    title: string
    icon: string | null
    parentPageId: string | null
    isFavorited: boolean
}

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    user: any
    projects?: Array<{
        id: string
        name: string
        color: string | null
        icon: string | null
        sortOrder: number
    }>
    onOpenCommand?: () => void
}

// Change to non-exported function, exported as memo at bottom
function SidebarComponent({ className, user, projects: initialProjects = [], onOpenCommand }: SidebarProps) {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()
    const { isSidebarCollapsed, toggleSidebarCollapsed } = useUIStore()

    const [profile, setProfile] = useState<any>(null)
    const [projectsExpanded, setProjectsExpanded] = useState(true)
    const [pagesExpanded, setPagesExpanded] = useState(true)
    const [showCreateDialog, setShowCreateDialog] = useState(false)
    // We use the prop directly, but if we need local optimistic updates we could use state. 
    // For now, let's rely on the prop which comes from server (fresh on refresh).
    // Actually, to support seamless optimistic updates from the create dialog without full page reload feels (though router.refresh behaves like one),
    // let's just use the prop. The CreateDialog calls router.refresh() which updates the prop.
    const projects = initialProjects
    const [pages, setPages] = useState<PageItem[]>([])

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
            // fetchProjects() removed - passed as prop
            fetchPages()
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

    async function fetchPages() {
        try {
            const { data } = await supabase
                .from('pages')
                .select('id, title, icon, parentPageId, isFavorited')
                .eq('userId', user?.id)
                .order('createdAt', { ascending: false })

            if (data) {
                setPages(data as PageItem[])
            }
        } catch (error) {
            console.error('Error fetching pages:', error)
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
        { label: 'Projects', icon: Folder, href: '/project-database' },
        { label: 'My Tasks', icon: CheckSquare, href: '/tasks' },
        { label: 'Areas', icon: LayoutGrid, href: '/areas' },
        { label: 'Focus', icon: Timer, href: '/focus' },
        { label: 'Habits', icon: Target, href: '/habits' },
    ]

    const sidebarContent = (
        <div className="group flex flex-col h-full bg-sidebar/95 backdrop-blur-xl border-r border-sidebar-border supports-[backdrop-filter]:bg-sidebar/80 relative">
            {/* Collapse Toggle Button - Floating on Border */}
            <button
                onClick={toggleSidebarCollapsed}
                className="absolute -right-3 top-8 z-50 h-6 w-6 rounded-full border border-sidebar-border bg-background flex items-center justify-center shadow-sm text-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
                <ChevronRight className={cn(
                    "h-3 w-3 transition-transform duration-200",
                    !isSidebarCollapsed && "rotate-180"
                )} />
            </button>


            {/* Header / User Profile Area */}
            <div className={cn("flex flex-col gap-4 transition-all duration-300", isSidebarCollapsed ? "px-2 py-6" : "px-4 py-6")}>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="ghost"
                            suppressHydrationWarning
                            className={cn(
                                "w-full justify-start hover:bg-accent/50 group p-2",
                                isSidebarCollapsed && "px-0 justify-center"
                            )}
                        >
                            <Avatar className={cn(
                                "border border-border/50 shadow-sm transition-transform group-hover:scale-105",
                                isSidebarCollapsed ? "h-8 w-8" : "h-8 w-8 mr-2"
                            )}>
                                <AvatarImage src={avatarUrl} />
                                <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                                    {displayName?.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            {!isSidebarCollapsed && (
                                <span className="text-sm font-medium truncate text-foreground/90">
                                    {displayName}
                                </span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent
                        className="w-56 p-1 mt-2 bg-popover/95 backdrop-blur-xl border-border/50 shadow-xl"
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



            {/* Main Navigation */}
            <div className="px-3 flex-1 overflow-y-auto no-scrollbar">
                <div className="space-y-1 mb-6">
                    {/* Search Trigger */}
                    <button
                        onClick={onOpenCommand}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 group relative w-full",
                            "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                            isSidebarCollapsed && "justify-center px-2"
                        )}
                    >
                        <Search className="h-4 w-4 transition-colors shrink-0 text-muted-foreground group-hover:text-foreground" />
                        {!isSidebarCollapsed && (
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="whitespace-nowrap"
                            >
                                Search
                            </motion.span>
                        )}
                    </button>
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
                                    <></>
                                )}
                            </Link>
                        )
                    })}
                </div>

                {/* Projects Section */}
                {!isSidebarCollapsed && (
                    <div className="px-3 mb-2">
                        <div className="flex items-center justify-between group mb-2">
                            <span className="text-sm font-medium text-muted-foreground">
                                Projects
                            </span>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <button
                                    onClick={() => setProjectsExpanded(!projectsExpanded)}
                                    className="p-1 hover:bg-accent rounded-sm transition-all duration-200"
                                    aria-label={projectsExpanded ? "Collapse projects" : "Expand projects"}
                                >
                                    <motion.div
                                        animate={{ rotate: projectsExpanded ? 90 : 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                    </motion.div>
                                </button>
                                <button
                                    onClick={() => setShowCreateDialog(true)}
                                    className="p-1 hover:bg-accent rounded-sm transition-all duration-200"
                                    aria-label="Add project"
                                >
                                    <Plus className="h-3 w-3 text-muted-foreground" />
                                </button>
                            </div>
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
                                            className="group/item flex items-center pr-2"
                                        >
                                            <Link
                                                href={`/projects/${project.id}`}
                                                className={cn(
                                                    "flex-1 flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors",
                                                    pathname === `/projects/${project.id}`
                                                        ? "text-foreground bg-accent/60 font-medium"
                                                        : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
                                                )}
                                            >
                                                <span className={cn(
                                                    "h-2 w-2 rounded-full ring-1 ring-white/10 shrink-0",
                                                    project.color === 'red' && "bg-red-500",
                                                    project.color === 'blue' && "bg-blue-500",
                                                    project.color === 'green' && "bg-green-500",
                                                    project.color === 'purple' && "bg-purple-500",
                                                    project.color === 'orange' && "bg-orange-500",
                                                    (!project.color || project.color === 'neutral') && "bg-zinc-400"
                                                )} />
                                                <span className="truncate">{project.name}</span>
                                            </Link>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button
                                                        className="opacity-0 group-hover/item:opacity-100 p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded transition-opacity"
                                                        aria-label="Project actions"
                                                        suppressHydrationWarning
                                                    >
                                                        <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            deleteProject(project.id)
                                                        }}
                                                        className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/10 gap-2"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                        Delete Project
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
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
                            <span className="text-sm font-medium text-muted-foreground">
                                Private
                            </span>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <button
                                    onClick={() => setPagesExpanded(!pagesExpanded)}
                                    className="p-1 hover:bg-accent rounded-sm transition-all duration-200"
                                    aria-label={pagesExpanded ? "Collapse private pages" : "Expand private pages"}
                                >
                                    <motion.div
                                        animate={{ rotate: pagesExpanded ? 90 : 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                    </motion.div>
                                </button>
                                <Link
                                    href="/private/new"
                                    className="p-1 hover:bg-accent rounded-sm transition-all duration-200"
                                    aria-label="Add private page"
                                >
                                    <Plus className="h-3 w-3 text-muted-foreground" />
                                </Link>
                            </div>
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
                                            className="group/item flex items-center pr-2"
                                        >
                                            <Link
                                                href={`/private/${page.id}`}
                                                className={cn(
                                                    "flex-1 flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors",
                                                    pathname === `/private/${page.id}`
                                                        ? "text-foreground bg-accent/60 font-medium"
                                                        : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
                                                )}
                                            >
                                                <span className="text-base shrink-0">{page.icon || '📄'}</span>
                                                <span className="truncate">{page.title}</span>
                                            </Link>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button
                                                        className="opacity-0 group-hover/item:opacity-100 p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded transition-opacity"
                                                        aria-label="Page actions"
                                                        suppressHydrationWarning
                                                    >
                                                        <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            deletePage(page.id)
                                                        }}
                                                        className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/10 gap-2"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                        Delete Page
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
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
        </div>
    )

    return (
        <>
            <motion.div
                className={cn("hidden md:block fixed inset-y-0 z-50", className)}
                initial={false}
                animate={{ width: isSidebarCollapsed ? 80 : 220 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
            >
                {sidebarContent}
            </motion.div>

            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden fixed top-3 left-3 z-50 bg-background/50 backdrop-blur-md border border-border/50 shadow-sm">
                        <Menu className="h-5 w-5" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-64 border-r border-border/50 bg-background/95 backdrop-blur-xl">
                    {sidebarContent}
                </SheetContent>
            </Sheet>
        </>
    )
}

export const Sidebar = memo(SidebarComponent)
