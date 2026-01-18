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
    <div className="flex-1 space-y-6 p-8 pt-6">
      <Suspense fallback={<PageLoadingSkeleton />}>
        <ProfileHeader />
      </Suspense>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Suspense fallback={<div>Loading stats...</div>}>
            <ProfileStats />
          </Suspense>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <Suspense fallback={<div>Loading activity...</div>}>
            <ProfileActivity />
          </Suspense>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          <Suspense fallback={<div>Loading achievements...</div>}>
            <ProfileAchievements />
          </Suspense>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <ProfileSettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}
