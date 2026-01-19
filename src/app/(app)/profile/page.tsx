import { Suspense } from 'react'
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
    <div className="flex-1 h-full flex flex-col animate-in-fade">
      {/* Sticky Header */}
      <div className="px-8 py-6 border-b border-border/40 bg-background/50 backdrop-blur-sm sticky top-0 z-10">
        <h2 className="text-2xl font-semibold tracking-tight">Your Profile</h2>
        <p className="text-sm text-muted-foreground">Manage your personal information and preferences.</p>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8">
        <Suspense fallback={<PageLoadingSkeleton />}>
          <ProfileHeader />
        </Suspense>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-6">
            <TabsTrigger
              value="overview"
              className="rounded-none border-b-2 border-transparent px-2 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-medium text-muted-foreground data-[state=active]:text-foreground transition-all"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="activity"
              className="rounded-none border-b-2 border-transparent px-2 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-medium text-muted-foreground data-[state=active]:text-foreground transition-all"
            >
              Activity
            </TabsTrigger>
            <TabsTrigger
              value="achievements"
              className="rounded-none border-b-2 border-transparent px-2 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-medium text-muted-foreground data-[state=active]:text-foreground transition-all"
            >
              Achievements
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="rounded-none border-b-2 border-transparent px-2 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-medium text-muted-foreground data-[state=active]:text-foreground transition-all"
            >
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8 animate-in-fade">
            <div>
              <h3 className="text-lg font-medium mb-4">Performance Stats</h3>
              <Suspense fallback={<div className="h-32 bg-muted animate-pulse rounded-lg" />}>
                <ProfileStats />
              </Suspense>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6 animate-in-fade">
            <Suspense fallback={<div className="h-32 bg-muted animate-pulse rounded-lg" />}>
              <ProfileActivity />
            </Suspense>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-6 animate-in-fade">
            <Suspense fallback={<div className="h-32 bg-muted animate-pulse rounded-lg" />}>
              <ProfileAchievements />
            </Suspense>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6 animate-in-fade">
            <ProfileSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
