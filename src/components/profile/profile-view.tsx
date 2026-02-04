import { Suspense } from 'react'
import { Activity, Trophy, Settings, User, Palette } from 'lucide-react'
import { ProfileHeader } from '@/components/profile/profile-header'
import { ProfileStats } from '@/components/profile/profile-stats'
import { ProfileActivity } from '@/components/profile/profile-activity'
import { ProfileSettings } from '@/components/profile/profile-settings'
import { ProfileAchievements } from '@/components/profile/profile-achievements'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageLoadingSkeleton } from '@/components/shared/loading-states'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ProfileAccount } from '@/components/profile/profile-account'
import { ProfileTheme } from '@/components/profile/profile-theme'
import { useUser } from '@/lib/hooks'
import { cn } from '@/lib/utils'

export function ProfileView() {
    const { user } = useUser()
    const email = user?.email
    const displayName = user?.user_metadata?.display_name || email?.split('@')[0] || 'User'
    const avatarUrl = user?.user_metadata?.avatar_url

    // Initials for avatar fallback
    const initials = (displayName || 'U').substring(0, 2).toUpperCase()

    return (
        <div className="flex-1 h-full flex flex-col md:flex-row overflow-hidden w-full bg-background">
            <Tabs defaultValue="account" className="flex-1 flex flex-col md:flex-row h-full">

                {/* Notion-style Sidebar */}
                <div className="w-full md:w-[240px] border-r border-[#E9E9E8] dark:border-[#2C2C2C] bg-[#F7F7F5] dark:bg-[#1F1F1F] flex-shrink-0 flex flex-col">
                    {/* User Profile Mini Header */}
                    <div className="p-3 mb-1">
                        <div className="flex items-center gap-3 px-2 py-1 rounded-sm hover:bg-[#EFEFEF] dark:hover:bg-[#2C2C2C] cursor-default transition-colors">
                            <Avatar className="h-5 w-5 rounded-sm">
                                <AvatarImage src={avatarUrl} />
                                <AvatarFallback className="text-[10px] rounded-sm">{initials}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate text-[#37352F] dark:text-[#D4D4D4] leading-none">{displayName}</p>
                                <p className="text-[11px] text-[#91918E] dark:text-[#818181] truncate leading-tight mt-0.5">{email}</p>
                            </div>
                        </div>
                    </div>

                    <div className="px-5 mb-2">
                        <div className="h-px bg-[#E9E9E8] dark:bg-[#2C2C2C]" />
                    </div>

                    <div className="px-2">
                        {/* 'Account' Label Removed */}
                        <TabsList className="flex flex-col items-start h-auto p-0 bg-transparent w-full space-y-[1px]">
                            <TabsTrigger
                                value="account"
                                className={cn(
                                    "w-full justify-start px-2 py-1 h-[28px] text-sm rounded-sm font-normal",
                                    "text-[#37352F] dark:text-[#D4D4D4]",
                                    "hover:bg-[#EFEFEF] dark:hover:bg-[#2C2C2C] transition-colors",
                                    "data-[state=active]:bg-[#EFEFEF] dark:data-[state=active]:bg-[#2C2C2C]",
                                    "data-[state=active]:text-[#37352F] dark:data-[state=active]:text-[#D4D4D4]",
                                    "data-[state=active]:font-medium",
                                    "data-[state=active]:shadow-none"
                                )}
                            >
                                <User className="h-4 w-4 mr-2.5 text-[#91918E] dark:text-[#818181]" />
                                My Account
                            </TabsTrigger>
                            <TabsTrigger
                                value="settings"
                                className={cn(
                                    "w-full justify-start px-2 py-1 h-[28px] text-sm rounded-sm font-normal",
                                    "text-[#37352F] dark:text-[#D4D4D4]",
                                    "hover:bg-[#EFEFEF] dark:hover:bg-[#2C2C2C] transition-colors",
                                    "data-[state=active]:bg-[#EFEFEF] dark:data-[state=active]:bg-[#2C2C2C]",
                                    "data-[state=active]:text-[#37352F] dark:data-[state=active]:text-[#D4D4D4]",
                                    "data-[state=active]:font-medium",
                                    "data-[state=active]:shadow-none"
                                )}
                            >
                                <Settings className="h-4 w-4 mr-2.5 text-[#91918E] dark:text-[#818181]" />
                                Settings
                            </TabsTrigger>
                            <TabsTrigger
                                value="theme"
                                className={cn(
                                    "w-full justify-start px-2 py-1 h-[28px] text-sm rounded-sm font-normal",
                                    "text-[#37352F] dark:text-[#D4D4D4]",
                                    "hover:bg-[#EFEFEF] dark:hover:bg-[#2C2C2C] transition-colors",
                                    "data-[state=active]:bg-[#EFEFEF] dark:data-[state=active]:bg-[#2C2C2C]",
                                    "data-[state=active]:text-[#37352F] dark:data-[state=active]:text-[#D4D4D4]",
                                    "data-[state=active]:font-medium",
                                    "data-[state=active]:shadow-none"
                                )}
                            >
                                <Palette className="h-4 w-4 mr-2.5 text-[#91918E] dark:text-[#818181]" />
                                Theme
                            </TabsTrigger>
                            {/* <TabsTrigger
                                value="achievements"
                                className={cn(
                                    "w-full justify-start px-2 py-1 h-[28px] text-sm rounded-sm font-normal",
                                    "text-[#37352F] dark:text-[#D4D4D4]",
                                    "hover:bg-[#EFEFEF] dark:hover:bg-[#2C2C2C] transition-colors",
                                    "data-[state=active]:bg-[#EFEFEF] dark:data-[state=active]:bg-[#2C2C2C]",
                                    "data-[state=active]:text-[#37352F] dark:data-[state=active]:text-[#D4D4D4]",
                                    "data-[state=active]:font-medium",
                                    "data-[state=active]:shadow-none"
                                )}
                            >
                                <Trophy className="h-4 w-4 mr-2.5 text-[#91918E] dark:text-[#818181]" />
                                Achievements
                            </TabsTrigger> */}
                            <TabsTrigger
                                value="activity"
                                className={cn(
                                    "w-full justify-start px-2 py-1 h-[28px] text-sm rounded-sm font-normal",
                                    "text-[#37352F] dark:text-[#D4D4D4]",
                                    "hover:bg-[#EFEFEF] dark:hover:bg-[#2C2C2C] transition-colors",
                                    "data-[state=active]:bg-[#EFEFEF] dark:data-[state=active]:bg-[#2C2C2C]",
                                    "data-[state=active]:text-[#37352F] dark:data-[state=active]:text-[#D4D4D4]",
                                    "data-[state=active]:font-medium",
                                    "data-[state=active]:shadow-none"
                                )}
                            >
                                <Activity className="h-4 w-4 mr-2.5 text-[#91918E] dark:text-[#818181]" />
                                Activity
                            </TabsTrigger>
                        </TabsList>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto min-w-0 bg-background">
                    <div className="px-8 py-6 md:px-12 md:py-8 space-y-8 max-w-4xl mx-auto">
                        {/* We keep the header but maybe simplify it if needed. 
                            For now, kept as is but inside the spacious container. */}


                        <div>
                            <TabsContent value="account" className="space-y-6 mt-0 animate-in fade-in-50 duration-200">
                                <ProfileAccount />
                            </TabsContent>

                            <TabsContent value="settings" className="space-y-6 mt-0 animate-in fade-in-50 duration-200">
                                <ProfileSettings />
                            </TabsContent>

                            <TabsContent value="theme" className="space-y-6 mt-0 animate-in fade-in-50 duration-200">
                                <ProfileTheme />
                            </TabsContent>

                            {/* <TabsContent value="achievements" className="space-y-6 mt-0 animate-in fade-in-50 duration-200">
                                <div>
                                    <h3 className="text-base font-medium mb-4 text-[#37352F] dark:text-[#D4D4D4]">Achievements</h3>
                                    <Suspense fallback={<div className="h-32 bg-muted/50 animate-pulse rounded-md" />}>
                                        <ProfileAchievements />
                                    </Suspense>
                                </div>
                            </TabsContent> */}

                            <TabsContent value="activity" className="space-y-6 mt-0 animate-in fade-in-50 duration-200">
                                <div>
                                    <h3 className="text-base font-medium mb-4 text-[#37352F] dark:text-[#D4D4D4]">Recent Activity</h3>
                                    <Suspense fallback={<div className="h-32 bg-muted/50 animate-pulse rounded-md" />}>
                                        <ProfileActivity />
                                    </Suspense>
                                </div>
                            </TabsContent>
                        </div>
                    </div>
                </div>
            </Tabs>
        </div>
    )
}
