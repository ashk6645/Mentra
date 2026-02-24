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
    Folder,
    CheckCircle2,
    Users2
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState, useEffect, memo } from 'react'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { motion, AnimatePresence } from 'framer-motion'
import { useUIStore } from '@/stores/use-ui-store'
import { MoreHorizontal, Trash2 } from 'lucide-react'

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { ProfileDialog } from '@/components/profile/profile-dialog'
import { CreateProjectDialog } from '@/components/projects/create-project-dialog'
import { ProjectRow } from '@/components/projects/project-row'
import { type Project } from '@/lib/actions/projects'



const TodayIcon = ({ className }: { className?: string }) => {
    const [date, setDate] = useState<number | null>(null)

    useEffect(() => {
        setDate(new Date().getDate())
    }, [])

    return (
        <div className={cn("relative flex items-center justify-center w-5 h-5", className)}>
            <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 20"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-full h-full"
            >
                <path d="M8 2v4" />
                <path d="M16 2v4" />
                <rect width="18" height="18" x="3" y="4" rx="2" />
            </svg>
            <span className="absolute text-[10px] font-bold pt-1.5 select-none">{date}</span>
        </div>
    )
}

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    user: any
    onOpenCommand?: () => void
    initialProjects?: Project[]
    counts?: {
        inbox: number
        today: number
        overdue: number
    }
}

// Change to non-exported function, exported as memo at bottom
function SidebarComponent({ className, user, onOpenCommand, initialProjects, counts }: SidebarProps) {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()
    const { isSidebarCollapsed, toggleSidebarCollapsed } = useUIStore()

    const [profile, setProfile] = useState<any>(null)
    const [projectsExpanded, setProjectsExpanded] = useState(true)

    const [showProfileDialog, setShowProfileDialog] = useState(false)
    const [projects, setProjects] = useState<Project[]>(initialProjects || [])
    const [showNewProjectDialog, setShowNewProjectDialog] = useState(false)
    const [editingProject, setEditingProject] = useState<Project | null>(null)

    // Reset expanded states when sidebar collapses to keep UI clean
    useEffect(() => {
        if (isSidebarCollapsed) {
            setProjectsExpanded(false)
        }
    }, [isSidebarCollapsed])



    // Sync state with server-provided projects
    useEffect(() => {
        if (initialProjects) {
            setProjects(initialProjects)
        }
    }, [initialProjects])

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
        router.refresh()
        router.push('/login')
    }

    const displayName = profile?.display_name || user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'User'
    const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url

    const routes = [
        { label: 'Inbox', icon: Inbox, href: '/inbox', badge: counts?.inbox, alert: (counts?.overdue || 0) > 0, shortcut: 'i' },
        { label: 'Today', icon: TodayIcon, href: '/today', badge: counts?.today, shortcut: 't' },
        { label: 'Upcoming', icon: CalendarDays, href: '/upcoming', shortcut: 'u' },
        { label: 'Completed', icon: CheckCircle2, href: '/completed', shortcut: 'c' },
        { label: 'Calendar', icon: Calendar, href: '/calendar', shortcut: 'l' },
        { label: 'Focus', icon: Timer, href: '/focus', shortcut: 'f' },
    ]

    const sidebarContent = (
        <div className="group flex flex-col h-full bg-sidebar/95 backdrop-blur-xl border-r border-sidebar-border supports-[backdrop-filter]:bg-sidebar/80 relative">
            {/* Logo Area */}
            <div className={cn("flex items-center h-14 transition-all duration-300", isSidebarCollapsed ? "justify-center px-2" : "px-4")}>
                <div className="relative h-8 w-full flex items-center justify-start gap-2">
                    <img
                        src="/Mentra1.png"
                        alt="Mentra"
                        className={cn(
                            "object-contain transition-all duration-300",
                            isSidebarCollapsed ? "h-6 w-6" : "h-8 w-auto"
                        )}
                    />
                    {!isSidebarCollapsed && (
                        <span className="font-bold text-xl tracking-wide text-foreground">MENTRA</span>
                    )}
                </div>
            </div>



            {/* Main Navigation */}
            <div className="px-2 flex-1 overflow-y-auto no-scrollbar">
                <div className="space-y-0.5 mb-6">
                    {/* Search Trigger */}
                    <button
                        onClick={onOpenCommand}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2 text-[15px] font-medium rounded-lg transition-all duration-200 group relative w-full h-10 mb-2",
                            "text-muted-foreground/80 hover:text-foreground hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50",
                            isSidebarCollapsed && "justify-center px-1"
                        )}
                    >
                        <Search className="h-5 w-5 transition-colors shrink-0 opacity-70" />
                        {!isSidebarCollapsed && (
                            <span className="truncate">Search</span>
                        )}
                        {!isSidebarCollapsed && (
                            <span className="ml-auto text-[10px] text-muted-foreground/50 border border-border/25 px-1 rounded">⌘K</span>
                        )}
                    </button>

                    {routes.map((route) => {
                        const isActive = pathname === route.href
                        return (
                            <Link
                                key={route.href}
                                href={route.href}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2 text-[15px] rounded-lg transition-all duration-200 ease-out group relative h-10",
                                    isActive
                                        ? "text-foreground bg-neutral-200/60 dark:bg-neutral-800/60 font-medium"
                                        : "text-muted-foreground hover:text-foreground hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50",
                                    isSidebarCollapsed && "justify-center px-1"
                                )}
                            >
                                <route.icon className={cn(
                                    "h-5 w-5 transition-colors shrink-0",
                                    isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                                )} />
                                {!isSidebarCollapsed && (
                                    <>
                                        <span className="truncate flex-1">
                                            {route.label}
                                        </span>

                                        {/* Badge with alert indicator */}
                                        {(route as any).badge !== undefined && (route as any).badge > 0 && (
                                            <span className={cn(
                                                "text-[10px] px-1.5 py-0.5 rounded-md font-medium min-w-[18px] text-center",
                                                (route as any).alert
                                                    ? "bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400"
                                                    : "bg-neutral-200 dark:bg-neutral-800 text-muted-foreground"
                                            )}>
                                                {(route as any).badge}
                                            </span>
                                        )}

                                        {/* Keyboard shortcut hint - shows on hover */}
                                        {(route as any).shortcut && (
                                            <kbd className="hidden lg:inline-flex h-5 w-5 items-center justify-center rounded border border-border/20 bg-muted/30 text-[10px] font-mono text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                                                {(route as any).shortcut}
                                            </kbd>
                                        )}
                                    </>
                                )}
                            </Link>
                        )
                    })}
                </div>

                {/* Projects Section */}
                {!isSidebarCollapsed && (
                    <div className="px-2 mb-2">
                        {/* Row: label navigates to /projects; + opens create; chevron toggles expand */}
                        <div className={cn(
                            "flex items-center mt-6 mb-1 px-3 py-2 h-10 rounded-lg transition-all duration-200 ease-out group relative",
                            pathname === '/projects'
                                ? "bg-neutral-200/60 dark:bg-neutral-800/60"
                                : "hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50"
                        )}>
                            {/* Label — navigates to /projects */}
                            <Link
                                href="/projects"
                                className={cn(
                                    "flex-1 text-[15px] transition-colors truncate before:absolute before:inset-0 before:z-0",
                                    pathname === '/projects'
                                        ? "text-foreground font-medium"
                                        : "text-muted-foreground group-hover:text-foreground font-medium"
                                )}
                            >
                                Projects
                            </Link>

                            <div className="flex items-center relative z-10 space-x-0.5">
                                {/* + button — opens create dialog only */}
                                <button
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        setShowNewProjectDialog(true)
                                    }}
                                    className="flex items-center justify-center w-7 h-7 hover:bg-zinc-300/50 dark:hover:bg-zinc-700/50 rounded-md transition-all duration-200 text-muted-foreground hover:text-foreground flex-shrink-0"
                                    aria-label="Add project"
                                >
                                    <Plus className="h-4 w-4" />
                                </button>

                                {/* Chevron — only toggles expand/collapse */}
                                <button
                                    onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        setProjectsExpanded(!projectsExpanded)
                                    }}
                                    className="flex items-center justify-center w-7 h-7 text-muted-foreground hover:text-foreground hover:bg-zinc-300/50 dark:hover:bg-zinc-700/50 transition-colors rounded-md flex-shrink-0"
                                    aria-label={projectsExpanded ? 'Collapse projects' : 'Expand projects'}
                                >
                                    <motion.div
                                        animate={{ rotate: projectsExpanded ? 90 : 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </motion.div>
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
                                    className="space-y-0.5 overflow-hidden"
                                >
                                    {projects.map((project, index) => (
                                        <motion.div
                                            key={project.id}
                                            initial={{ x: -10, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            transition={{ delay: index * 0.05 }}
                                        >
                                            <ProjectRow
                                                project={project}
                                                onEdit={(proj) => {
                                                    setEditingProject(proj)
                                                    setShowNewProjectDialog(true)
                                                }}
                                            />
                                        </motion.div>
                                    ))}
                                    {projects.length === 0 && (
                                        <button
                                            onClick={() => setShowNewProjectDialog(true)}
                                            className="flex items-center gap-3 px-3 py-2 text-[15px] text-muted-foreground hover:text-foreground rounded-lg transition-colors w-full h-10 hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50"
                                        >
                                            <Plus className="h-5 w-5" />
                                            <span>New project</span>
                                        </button>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}


            </div>

            {/* User Profile Area - Moved to Bottom */}
            <div className={cn("flex flex-col gap-2 transition-all duration-300 border-t border-sidebar-border mt-auto", isSidebarCollapsed ? "px-2 py-3" : "px-3 py-3")}>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="ghost"
                            suppressHydrationWarning
                            className={cn(
                                "w-full justify-start hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50 h-10 px-3 transition-colors duration-200",
                                isSidebarCollapsed && "px-0 justify-center"
                            )}
                        >
                            <div className={cn("flex items-center gap-3 w-full", isSidebarCollapsed && "justify-center")}>
                                <Avatar className="h-6 w-6 border border-border/20 shadow-sm shrink-0">
                                    <AvatarImage src={avatarUrl} />
                                    <AvatarFallback className="bg-orange-500/10 text-orange-600 text-[11px] font-medium">
                                        {displayName?.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                {!isSidebarCollapsed && (
                                    <>
                                        <span className="text-[15px] font-medium truncate opacity-90">
                                            {displayName}
                                        </span>
                                        <div className="ml-auto flex items-center text-muted-foreground">
                                            {/* Changed rotation to -90 or 0 depending on preference, kept generic or removed if implied up */}
                                            <ChevronRight className="h-4 w-4 opacity-50" />
                                        </div>
                                    </>
                                )}
                            </div>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent
                        className="w-52 p-1 mb-1 bg-popover/95 backdrop-blur-xl border-border/25 shadow-xl"
                        align="start"
                        side="right"
                        sideOffset={10}
                    >
                        <div className="flex items-center gap-2 p-2 mb-1">
                            <Avatar className="h-8 w-8 border border-border/20">
                                <AvatarImage src={avatarUrl} />
                                <AvatarFallback className="bg-orange-500/10 text-orange-600 text-xs font-medium">
                                    {displayName?.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                <span className="text-sm font-medium">{displayName}</span>
                                <span className="text-xs text-muted-foreground">{user?.email}</span>
                            </div>
                        </div>
                        <Separator className="my-1 bg-border/50" />

                        <div className="space-y-0.5">
                            <Button
                                variant="ghost"
                                className="w-full justify-start h-8 px-2 text-sm font-normal"
                                onClick={() => setShowProfileDialog(true)}
                            >
                                <UserIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                                Profile
                            </Button>

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


            <CreateProjectDialog
                open={showNewProjectDialog}
                onOpenChange={(open) => {
                    setShowNewProjectDialog(open)
                    if (!open) {
                        setEditingProject(null)
                    }
                }}
                mode={editingProject ? 'edit' : 'create'}
                project={editingProject || undefined}
                onSuccess={() => {
                    // Projects will be refreshed via revalidation
                    setEditingProject(null)
                }}
            />

            <ProfileDialog
                open={showProfileDialog}
                onOpenChange={setShowProfileDialog}
            />
        </div >
    )

    return (
        <>
            <motion.div
                className={cn("hidden md:block fixed inset-y-0 left-0 z-50 w-[220px]", className)}
                initial={false}
                animate={{ x: isSidebarCollapsed ? -220 : 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
            >
                {sidebarContent}
            </motion.div>

            {/* Floating Toggle Button (Desktop) */}
            <motion.button
                onClick={toggleSidebarCollapsed}
                className={cn(
                    "hidden md:flex fixed z-[60] top-8 h-6 w-6 items-center justify-center rounded-full border border-black/10 bg-white shadow-sm text-neutral-600 hover:bg-neutral-50 hover:text-black transition-colors outline-none",
                    isSidebarCollapsed ? "bg-white/80 backdrop-blur" : "bg-white"
                )}
                initial={false}
                animate={{
                    x: isSidebarCollapsed ? 12 : 220 - 12,
                    opacity: 1
                }}
                whileHover={{ opacity: 1 }} // Always visible on hover
                transition={{ duration: 0.3, ease: "easeInOut" }}
                aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
                <ChevronRight className={cn(
                    "h-3.5 w-3.5 transition-transform duration-200",
                    !isSidebarCollapsed && "rotate-180"
                )} />
            </motion.button>

            <Sheet>
                <SheetTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden fixed top-3 left-3 z-50 bg-background/50 backdrop-blur-md border border-border/25 shadow-sm"
                        suppressHydrationWarning
                    >
                        <Menu className="h-5 w-5" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-64 border-r border-border/25 bg-background/95 backdrop-blur-xl">
                    {sidebarContent}
                </SheetContent>
            </Sheet>
        </>
    )
}

export const Sidebar = memo(SidebarComponent)
