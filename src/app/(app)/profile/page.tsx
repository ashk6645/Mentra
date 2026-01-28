import { Suspense } from 'react'
import { Activity, Trophy, Settings } from 'lucide-react'
import { ProfileHeader } from '@/components/profile/profile-header'
import { ProfileStats } from '@/components/profile/profile-stats'
import { ProfileActivity } from '@/components/profile/profile-activity'
import { ProfileSettings } from '@/components/profile/profile-settings'
import { ProfileAchievements } from '@/components/profile/profile-achievements'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageLoadingSkeleton } from '@/components/shared/loading-states'

export const metadata = {
  title: 'Profile',
  description: 'Manage your profile and settings',
}

export default function ProfilePage() {
  return (
    <div className="flex-1 h-full flex flex-col md:flex-row overflow-hidden">
      <Tabs defaultValue="activity" className="flex-1 flex flex-col md:flex-row h-full">

        {/* Sidebar Container */}
        <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border/40 bg-card/30 flex-shrink-0 flex flex-col">
          <div className="p-6 pb-2">
            <h2 className="text-xl font-bold tracking-tight">Profile</h2>
            <p className="text-xs text-muted-foreground mt-1">Manage your account</p>
          </div>

          <TabsList className="flex flex-row md:flex-col justify-start items-stretch h-auto p-2 gap-1 bg-transparent w-full overflow-x-auto md:overflow-visible">
            <TabsTrigger
              value="activity"
              className="justify-start px-4 py-2.5 h-auto text-sm font-medium rounded-md border-0 bg-transparent text-muted-foreground hover:bg-muted/50 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none transition-all w-full gap-2"
            >
              <Activity className="h-4 w-4" />
              Activity
            </TabsTrigger>
            <TabsTrigger
              value="achievements"
              className="justify-start px-4 py-2.5 h-auto text-sm font-medium rounded-md border-0 bg-transparent text-muted-foreground hover:bg-muted/50 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none transition-all w-full gap-2"
            >
              <Trophy className="h-4 w-4" />
              Achievements
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="justify-start px-4 py-2.5 h-auto text-sm font-medium rounded-md border-0 bg-transparent text-muted-foreground hover:bg-muted/50 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none transition-all w-full gap-2"
            >
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto min-w-0">
          <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto">
            <Suspense fallback={<PageLoadingSkeleton />}>
              <ProfileHeader />
            </Suspense>

            <div className="mt-6">
              <TabsContent value="activity" className="space-y-6 mt-0 animate-in fade-in-50 duration-300">
                <Suspense fallback={<div className="h-32 bg-muted/50 animate-pulse rounded-xl" />}>
                  <ProfileActivity />
                </Suspense>
              </TabsContent>

              <TabsContent value="achievements" className="space-y-6 mt-0 animate-in fade-in-50 duration-300">
                <Suspense fallback={<div className="h-32 bg-muted/50 animate-pulse rounded-xl" />}>
                  <ProfileAchievements />
                </Suspense>
              </TabsContent>

              <TabsContent value="settings" className="space-y-6 mt-0 animate-in fade-in-50 duration-300">
                <ProfileSettings />
              </TabsContent>
            </div>
          </div>
        </div>
      </Tabs>
    </div>
  )
}