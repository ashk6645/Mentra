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
    <div className="flex-1 h-full flex flex-col">
      {/* Modern Header with Gradient */}
      <div className="relative px-8 py-8 border-b border-border/40 bg-gradient-to-br from-primary/5 via-background to-background backdrop-blur-sm">
        <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,transparent,black)]" />
        <div className="relative">
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
            Your Profile
          </h2>
          <p className="text-sm text-muted-foreground mt-1">Manage your personal information and track your progress.</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8">
        <Suspense fallback={<PageLoadingSkeleton />}>
          <ProfileHeader />
        </Suspense>

        <Tabs defaultValue="activity" className="space-y-6">
          <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-8">
            <TabsTrigger
              value="activity"
              className="rounded-none border-b-2 border-transparent px-0 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-semibold text-muted-foreground data-[state=active]:text-foreground transition-all"
            >
              Activity
            </TabsTrigger>
            <TabsTrigger
              value="achievements"
              className="rounded-none border-b-2 border-transparent px-0 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-semibold text-muted-foreground data-[state=active]:text-foreground transition-all"
            >
              Achievements
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="rounded-none border-b-2 border-transparent px-0 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none font-semibold text-muted-foreground data-[state=active]:text-foreground transition-all"
            >
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="activity" className="space-y-6 animate-in fade-in-50 duration-300">
            <Suspense fallback={<div className="h-32 bg-muted/50 animate-pulse rounded-xl" />}>
              <ProfileActivity />
            </Suspense>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-6 animate-in fade-in-50 duration-300">
            <Suspense fallback={<div className="h-32 bg-muted/50 animate-pulse rounded-xl" />}>
              <ProfileAchievements />
            </Suspense>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6 animate-in fade-in-50 duration-300">
            <ProfileSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}