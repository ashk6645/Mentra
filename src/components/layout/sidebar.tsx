'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    LayoutDashboard,
    CheckSquare,
    Calendar,
    Inbox,
    Settings,
    LogOut,
    User as UserIcon,
    Menu,
    Folder,
    Sun,
    CalendarDays,
    LayoutGrid,
    Timer,
    Target,
    ChevronRight,
    Plus
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
import { Search } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
    projects: Project[]
    user: any
    onOpenCommand?: () => void
}

export function Sidebar({ className, projects, user, onOpenCommand }: SidebarProps) {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()
    const [profile, setProfile] = useState<any>(null)
    const [projectsExpanded, setProjectsExpanded] = useState(true)
    const [showCreateDialog, setShowCreateDialog] = useState(false)

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
        {
            label: 'Dashboard',
            icon: LayoutDashboard,
            href: '/dashboard',
            variant: 'default'
        },
        {
            label: 'Inbox',
            icon: Inbox,
            href: '/inbox',
            variant: 'ghost'
        },
        {
            label: 'Today',
            icon: Sun,
            href: '/today',
            variant: 'ghost'
        },
        {
            label: 'Upcoming',
            icon: CalendarDays,
            href: '/upcoming',
            variant: 'ghost'
        },
        {
            label: 'My Tasks',
            icon: CheckSquare,
            href: '/tasks',
            variant: 'ghost'
        },
        {
            label: 'Areas',
            icon: LayoutGrid,
            href: '/areas',
            variant: 'ghost'
        },
        {
            label: 'Focus',
            icon: Timer,
            href: '/focus',
            variant: 'ghost'
        },
        {
            label: 'Habits',
            icon: Target,
            href: '/habits',
            variant: 'ghost'
        },
    ]

    const SidebarContent = () => (
        <div className="space-y-4 py-4 flex flex-col h-full bg-muted/20 border-r">
            <div className="px-3 py-2">
                <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                    Task App
                </h2>
                
                {/* Search/Command Button */}
                <Button
                    variant="outline"
                    className="w-full justify-start mb-2 text-muted-foreground"
                    onClick={onOpenCommand}
                >
                    <Search className="mr-2 h-4 w-4" />
                    <span>Search</span>
                    <kbd className="pointer-events-none ml-auto inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                        <span className="text-xs">⌘</span>K
                    </kbd>
                </Button>
                
                <div className="space-y-1">
                    {routes.map((route) => (
                        <Button
                            key={route.href}
                            variant={pathname === route.href ? 'secondary' : 'ghost'}
                            className="w-full justify-start"
                            asChild
                        >
                            <Link href={route.href}>
                                <route.icon className="mr-2 h-4 w-4" />
                                {route.label}
                            </Link>
                        </Button>
                    ))}
                </div>
            </div>

            <div className="px-3 py-2 flex-1 overflow-y-auto">
                <div className="mb-2 px-2">
                    <button
                        onClick={() => setProjectsExpanded(!projectsExpanded)}
                        className="flex items-center justify-between w-full text-xs font-semibold tracking-tight text-muted-foreground hover:text-foreground transition-colors py-1"
                    >
                        <div className="flex items-center gap-2">
                            <motion.div
                                animate={{ rotate: projectsExpanded ? 90 : 0 }}
                                transition={{ duration: 0.2, ease: "easeInOut" }}
                            >
                                <ChevronRight className="h-3 w-3" />
                            </motion.div>
                            <span>PROJECTS</span>
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation()
                                setShowCreateDialog(true)
                            }}
                            className="p-1 hover:bg-accent rounded transition-colors"
                        >
                            <Plus className="h-3 w-3" />
                        </button>
                    </button>
                </div>
                
                <AnimatePresence initial={false}>
                    {projectsExpanded && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                            className="space-y-1 overflow-hidden"
                        >
                            {projects.map((project, index) => (
                                <motion.div
                                    key={project.id}
                                    initial={{ x: -20, opacity: 0 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    exit={{ x: -20, opacity: 0 }}
                                    transition={{ 
                                        duration: 0.2, 
                                        delay: index * 0.03,
                                        ease: "easeOut"
                                    }}
                                >
                                    <Button
                                        variant={pathname === `/projects/${project.id}` ? 'secondary' : 'ghost'}
                                        className="w-full justify-start font-normal truncate"
                                        asChild
                                    >
                                        <Link href={`/projects/${project.id}`}>
                                            <span className={cn(
                                                "mr-2 h-2 w-2 rounded-full",
                                                project.color === 'red' && "bg-red-500",
                                                project.color === 'blue' && "bg-blue-500",
                                                project.color === 'green' && "bg-green-500",
                                                project.color === 'purple' && "bg-purple-500",
                                                project.color === 'orange' && "bg-orange-500",
                                                (!project.color || project.color === 'neutral') && "bg-gray-400"
                                            )} />
                                            {project.name}
                                        </Link>
                                    </Button>
                                </motion.div>
                            ))}
                            {projects.length === 0 && (
                                <motion.p 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="px-4 py-2 text-xs text-muted-foreground"
                                >
                                    No projects yet
                                </motion.p>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
                
                <CreateProjectDialog 
                    open={showCreateDialog} 
                    onOpenChange={setShowCreateDialog}
                />
            </div>

            <div className="mt-auto px-3 py-2 border-t">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="ghost"
                            className="w-full justify-start px-2 h-auto py-2"
                        >
                            <Avatar className="h-8 w-8 mr-2">
                                <AvatarImage src={avatarUrl} />
                                <AvatarFallback className="text-xs">
                                    {displayName?.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col items-start flex-1 min-w-0">
                                <span className="text-sm font-medium truncate w-full text-left">
                                    {displayName}
                                </span>
                                <span className="text-xs text-muted-foreground truncate w-full text-left">
                                    {user?.email}
                                </span>
                            </div>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent 
                        className="w-64 p-2" 
                        align="end" 
                        side="top"
                        sideOffset={8}
                    >
                        <div className="space-y-1">
                            <Button
                                variant={pathname === '/profile' ? 'secondary' : 'ghost'}
                                className="w-full justify-start"
                                asChild
                            >
                                <Link href="/profile">
                                    <UserIcon className="mr-2 h-4 w-4" />
                                    View Profile
                                </Link>
                            </Button>
                            <Button
                                variant="ghost"
                                className="w-full justify-start"
                                asChild
                            >
                                <Link href="/dashboard">
                                    <Settings className="mr-2 h-4 w-4" />
                                    Settings
                                </Link>
                            </Button>
                            <Separator className="my-1" />
                            <Button 
                                variant="ghost" 
                                className="w-full justify-start text-red-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950" 
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
            {/* Desktop Sidebar */}
            <div className={cn("hidden md:block w-64 fixed inset-y-0 z-50", className)}>
                <SidebarContent />
            </div>

            {/* Mobile Sidebar Trigger */}
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden fixed top-4 left-4 z-50">
                        <Menu className="h-5 w-5" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-64">
                    <SidebarContent />
                </SheetContent>
            </Sheet>
        </>
    )
}
