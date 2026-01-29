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
import { PanelLeftClose, MoreHorizontal, Trash2 } from 'lucide-react'
import { deletePage, getPages } from '@/lib/actions/pages'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { ProfileDialog } from '@/components/profile/profile-dialog'

interface PageItem {
    id: string
    title: string
    icon: string | null
    parentPageId: string | null
    isFavorited: boolean
    isShared?: boolean
}

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    user: any
    onOpenCommand?: () => void
}

// Change to non-exported function, exported as memo at bottom
function SidebarComponent({ className, user, onOpenCommand }: SidebarProps) {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()
    const { isSidebarCollapsed, toggleSidebarCollapsed } = useUIStore()

    const [profile, setProfile] = useState<any>(null)
    const [sharedExpanded, setSharedExpanded] = useState(true)
    const [pagesExpanded, setPagesExpanded] = useState(true)

    const [showProfileDialog, setShowProfileDialog] = useState(false)
    const [pages, setPages] = useState<PageItem[]>([])

    // Reset expanded states when sidebar collapses to keep UI clean
    useEffect(() => {
        if (isSidebarCollapsed) {
            setSharedExpanded(false)
            setPagesExpanded(false)
        }
    }, [isSidebarCollapsed])

    useEffect(() => {
        if (user?.id) {
            fetchProfile()
        }
    }, [user?.id])

    useEffect(() => {
        if (user?.id) {
            fetchPages()
        }
    }, [user?.id, pathname])

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
        console.log("Fetching pages for user:", user?.id)
        try {
            const result = await getPages()

            if (result.success && result.pages) {
                console.log("Fetched pages:", result.pages.length, result.pages)
                setPages(result.pages as PageItem[])
            } else {
                console.error("Error fetching pages via action:", result.error)
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
        { label: 'Completed', icon: CheckCircle2, href: '/completed' },
        { label: 'My Tasks', icon: CheckSquare, href: '/tasks' },
        { label: 'Calendar', icon: Calendar, href: '/calendar' },
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
            <div className={cn("flex flex-col gap-2 transition-all duration-300", isSidebarCollapsed ? "px-2 py-3" : "px-3 py-3")}>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="ghost"
                            suppressHydrationWarning
                            className={cn(
                                "w-full justify-start hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50 h-9 px-2 transition-colors duration-200",
                                isSidebarCollapsed && "px-0 justify-center"
                            )}
                        >
                            <div className={cn("flex items-center gap-2 w-full", isSidebarCollapsed && "justify-center")}>
                                <Avatar className="h-5 w-5 border border-border/20 shadow-sm shrink-0">
                                    <AvatarImage src={avatarUrl} />
                                    <AvatarFallback className="bg-orange-500/10 text-orange-600 text-[10px] font-medium">
                                        {displayName?.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                {!isSidebarCollapsed && (
                                    <>
                                        <span className="text-sm font-medium truncate opacity-90">
                                            {displayName}'s Workspace
                                        </span>
                                        <div className="ml-auto flex items-center text-muted-foreground">
                                            <span className="text-[10px] border border-border px-1 rounded bg-background/50 mr-1">Free</span>
                                            <ChevronRight className="h-3 w-3 rotate-90 opacity-50" />
                                        </div>
                                    </>
                                )}
                            </div>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent
                        className="w-52 p-1 mt-1 bg-popover/95 backdrop-blur-xl border-border/50 shadow-xl"
                        align="start"
                        side="bottom"
                        sideOffset={0}
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



            {/* Main Navigation */}
            <div className="px-2 flex-1 overflow-y-auto no-scrollbar">
                <div className="space-y-0.5 mb-6">
                    {/* Search Trigger */}
                    <button
                        onClick={onOpenCommand}
                        className={cn(
                            "flex items-center gap-2 px-3 py-1 text-sm font-medium rounded-sm transition-all duration-200 group relative w-full h-8 mb-2",
                            "text-muted-foreground/80 hover:text-foreground hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50",
                            isSidebarCollapsed && "justify-center px-1"
                        )}
                    >
                        <Search className="h-4 w-4 transition-colors shrink-0 opacity-70" />
                        {!isSidebarCollapsed && (
                            <span className="truncate">Search</span>
                        )}
                        {!isSidebarCollapsed && (
                            <span className="ml-auto text-[10px] text-muted-foreground/50 border border-border/50 px-1 rounded">⌘K</span>
                        )}
                    </button>

                    {routes.map((route) => {
                        const isActive = pathname === route.href
                        return (
                            <Link
                                key={route.href}
                                href={route.href}
                                className={cn(
                                    "flex items-center gap-2.5 px-3 py-1 text-sm rounded-sm transition-all duration-200 group relative h-8",
                                    isActive
                                        ? "text-foreground bg-neutral-200/60 dark:bg-neutral-800/60 font-medium"
                                        : "text-muted-foreground hover:text-foreground hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50",
                                    isSidebarCollapsed && "justify-center px-1"
                                )}
                            >
                                <route.icon className={cn(
                                    "h-4 w-4 transition-colors shrink-0",
                                    isActive ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                                )} />
                                {!isSidebarCollapsed && (
                                    <span className="truncate">
                                        {route.label}
                                    </span>
                                )}
                            </Link>
                        )
                    })}
                </div>



                {/* Shared Pages Section */}
                {!isSidebarCollapsed && pages.some(p => p.isShared) && (
                    <div className="px-2 mb-2">
                        <div
                            className="flex items-center justify-between group mb-1 mt-4 px-2 py-1 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 rounded-sm cursor-pointer transition-colors"
                            onClick={() => setSharedExpanded(!sharedExpanded)}
                        >
                            <span className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider select-none">
                                Shared
                            </span>
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <div className="p-0.5 text-muted-foreground">
                                    <motion.div
                                        animate={{ rotate: sharedExpanded ? 90 : 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <ChevronRight className="h-3 w-3" />
                                    </motion.div>
                                </div>
                            </div>
                        </div>

                        <AnimatePresence initial={false}>
                            {sharedExpanded && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3, ease: "circOut" }}
                                    className="space-y-0.5 overflow-hidden"
                                >
                                    {pages.filter(p => p.isShared).map((page, index) => (
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
                                                    "flex-1 flex items-center gap-2 px-3 py-1 text-sm rounded-sm transition-colors",
                                                    pathname === `/private/${page.id}`
                                                        ? "text-foreground bg-neutral-200/60 dark:bg-neutral-800/60 font-medium"
                                                        : "text-muted-foreground hover:text-foreground hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50"
                                                )}
                                            >
                                                <span className="text-sm shrink-0 opacity-80">{page.icon || '📄'}</span>
                                                <span className="truncate">{page.title}</span>
                                                <Users2 className="h-3 w-3 text-muted-foreground ml-auto" />
                                            </Link>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button
                                                        className="opacity-0 group-hover/item:opacity-100 p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded transition-opacity"
                                                        aria-label="Page actions"
                                                        suppressHydrationWarning
                                                    >
                                                        <MoreHorizontal className="w-3 h-3 text-muted-foreground" />
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
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}

                {/* Private Pages Section */}
                {!isSidebarCollapsed && (
                    <div className="px-2 mb-2">
                        <div
                            className="flex items-center justify-between group mb-1 mt-4 px-2 py-1 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 rounded-sm cursor-pointer transition-colors"
                            onClick={() => setPagesExpanded(!pagesExpanded)}
                        >
                            <span className="text-[11px] font-semibold text-muted-foreground/70 uppercase tracking-wider select-none">
                                Workspace
                            </span>
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <div className="p-0.5 text-muted-foreground">
                                    <motion.div
                                        animate={{ rotate: pagesExpanded ? 90 : 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <ChevronRight className="h-3 w-3" />
                                    </motion.div>
                                </div>
                                <Link
                                    href="/pages/new"
                                    onClick={(e) => e.stopPropagation()}
                                    className="p-0.5 hover:bg-zinc-300/50 dark:hover:bg-zinc-700/50 rounded-sm transition-all duration-200 text-muted-foreground"
                                    aria-label="Add private page"
                                >
                                    <Plus className="h-3 w-3" />
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
                                    className="space-y-0.5 overflow-hidden"
                                >
                                    {pages.filter(p => !p.isShared).map((page, index) => (
                                        <motion.div
                                            key={page.id}
                                            initial={{ x: -10, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            transition={{ delay: index * 0.05 }}
                                            className="group/item flex items-center pr-2"
                                        >
                                            <Link
                                                href={`/pages/${page.id}`}
                                                className={cn(
                                                    "flex-1 flex items-center gap-2 px-3 py-1 text-sm rounded-sm transition-colors",
                                                    pathname === `/pages/${page.id}`
                                                        ? "text-foreground bg-neutral-200/60 dark:bg-neutral-800/60 font-medium"
                                                        : "text-muted-foreground hover:text-foreground hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50"
                                                )}
                                            >
                                                <span className="text-sm shrink-0 opacity-80">{page.icon || '📄'}</span>
                                                <span className="truncate">{page.title}</span>
                                            </Link>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button
                                                        className="opacity-0 group-hover/item:opacity-100 p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded transition-opacity"
                                                        aria-label="Page actions"
                                                        suppressHydrationWarning
                                                    >
                                                        <MoreHorizontal className="w-3 h-3 text-muted-foreground" />
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
                                    {pages.filter(p => !p.isShared).length === 0 && (
                                        <Link
                                            href="/pages/new"
                                            className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
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


            <ProfileDialog
                open={showProfileDialog}
                onOpenChange={setShowProfileDialog}
            />
        </div >
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
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden fixed top-3 left-3 z-50 bg-background/50 backdrop-blur-md border border-border/50 shadow-sm"
                        suppressHydrationWarning
                    >
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
