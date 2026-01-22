import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { createClient } from '@/lib/supabase/server'
import { Trophy, Star, Target, Zap, Flame, CheckCircle2, Calendar, Clock } from 'lucide-react'
import prisma from '@/lib/prisma'

interface Achievement {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  progress: number
  max: number
  unlocked: boolean
  category: 'tasks' | 'streak' | 'xp' | 'focus'
}

export async function ProfileAchievements() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Get user stats
  const profile = await prisma.profile.findUnique({
    where: { id: user.id }
  })

  const completedTasks = await prisma.task.count({
    where: { userId: user.id, completed: true }
  })

  const focusSessions = await prisma.focusSession.count({
    where: { userId: user.id }
  })

  const totalFocusMinutes = await prisma.focusSession.aggregate({
    where: { userId: user.id },
    _sum: { durationMinutes: true }
  })

  // Define achievements
  const achievements: Achievement[] = [
    // Task Achievements
    {
      id: 'first-task',
      title: 'Getting Started',
      description: 'Complete your first task',
      icon: <CheckCircle2 className="h-6 w-6" />,
      progress: Math.min(completedTasks, 1),
      max: 1,
      unlocked: completedTasks >= 1,
      category: 'tasks'
    },
    {
      id: 'task-10',
      title: 'Task Master',
      description: 'Complete 10 tasks',
      icon: <Target className="h-6 w-6" />,
      progress: Math.min(completedTasks, 10),
      max: 10,
      unlocked: completedTasks >= 10,
      category: 'tasks'
    },
    {
      id: 'task-50',
      title: 'Productivity Pro',
      description: 'Complete 50 tasks',
      icon: <Trophy className="h-6 w-6" />,
      progress: Math.min(completedTasks, 50),
      max: 50,
      unlocked: completedTasks >= 50,
      category: 'tasks'
    },
    {
      id: 'task-100',
      title: 'Century Club',
      description: 'Complete 100 tasks',
      icon: <Star className="h-6 w-6" />,
      progress: Math.min(completedTasks, 100),
      max: 100,
      unlocked: completedTasks >= 100,
      category: 'tasks'
    },

    // Streak Achievements
    {
      id: 'streak-3',
      title: 'On a Roll',
      description: 'Maintain a 3-day streak',
      icon: <Flame className="h-6 w-6" />,
      progress: Math.min(profile?.currentStreak || 0, 3),
      max: 3,
      unlocked: (profile?.currentStreak || 0) >= 3,
      category: 'streak'
    },
    {
      id: 'streak-7',
      title: 'Week Warrior',
      description: 'Maintain a 7-day streak',
      icon: <Flame className="h-6 w-6" />,
      progress: Math.min(profile?.currentStreak || 0, 7),
      max: 7,
      unlocked: (profile?.currentStreak || 0) >= 7,
      category: 'streak'
    },
    {
      id: 'streak-30',
      title: 'Monthly Master',
      description: 'Maintain a 30-day streak',
      icon: <Flame className="h-6 w-6" />,
      progress: Math.min(profile?.currentStreak || 0, 30),
      max: 30,
      unlocked: (profile?.currentStreak || 0) >= 30,
      category: 'streak'
    },

    // XP Achievements
    {
      id: 'xp-100',
      title: 'Beginner',
      description: 'Earn 100 XP',
      icon: <Zap className="h-6 w-6" />,
      progress: Math.min(profile?.totalXp || 0, 100),
      max: 100,
      unlocked: (profile?.totalXp || 0) >= 100,
      category: 'xp'
    },
    {
      id: 'xp-500',
      title: 'Experienced',
      description: 'Earn 500 XP',
      icon: <Zap className="h-6 w-6" />,
      progress: Math.min(profile?.totalXp || 0, 500),
      max: 500,
      unlocked: (profile?.totalXp || 0) >= 500,
      category: 'xp'
    },
    {
      id: 'xp-1000',
      title: 'Expert',
      description: 'Earn 1,000 XP',
      icon: <Zap className="h-6 w-6" />,
      progress: Math.min(profile?.totalXp || 0, 1000),
      max: 1000,
      unlocked: (profile?.totalXp || 0) >= 1000,
      category: 'xp'
    },

    // Focus Achievements
    {
      id: 'focus-first',
      title: 'Focused Mind',
      description: 'Complete your first focus session',
      icon: <Clock className="h-6 w-6" />,
      progress: Math.min(focusSessions, 1),
      max: 1,
      unlocked: focusSessions >= 1,
      category: 'focus'
    },
    {
      id: 'focus-10hours',
      title: 'Deep Worker',
      description: 'Focus for 10 hours total',
      icon: <Clock className="h-6 w-6" />,
      progress: Math.min(totalFocusMinutes._sum.durationMinutes || 0, 600),
      max: 600,
      unlocked: (totalFocusMinutes._sum.durationMinutes || 0) >= 600,
      category: 'focus'
    },
  ]

  const unlockedCount = achievements.filter(a => a.unlocked).length
  const categories = ['tasks', 'streak', 'xp', 'focus'] as const

  return (
    <div className="space-y-6">
      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Achievements</CardTitle>
          <CardDescription>
            Track your progress and unlock rewards
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium">
                  {unlockedCount} of {achievements.length} unlocked
                </span>
                <span className="text-sm text-muted-foreground">
                  {Math.round((unlockedCount / achievements.length) * 100)}%
                </span>
              </div>
              <Progress
                value={(unlockedCount / achievements.length) * 100}
              />
            </div>
            <Trophy className="h-12 w-12 text-yellow-500" />
          </div>
        </CardContent>
      </Card>

      {/* Achievement Categories */}
      {categories.map(category => {
        const categoryAchievements = achievements.filter(a => a.category === category)
        const categoryUnlocked = categoryAchievements.filter(a => a.unlocked).length

        return (
          <Card key={category}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="capitalize">{category} Achievements</CardTitle>
                <Badge variant="secondary">
                  {categoryUnlocked} / {categoryAchievements.length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                {categoryAchievements.map(achievement => (
                  <div
                    key={achievement.id}
                    className={`flex gap-4 rounded-lg border p-4 transition-all ${achievement.unlocked
                      ? 'border-primary bg-primary/5'
                      : 'opacity-60 grayscale'
                      }`}
                  >
                    <div
                      className={`rounded-full p-3 ${achievement.unlocked
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                        }`}
                    >
                      {achievement.icon}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-semibold">{achievement.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {achievement.description}
                          </p>
                        </div>
                        {achievement.unlocked && (
                          <Badge className="ml-2">Unlocked</Badge>
                        )}
                      </div>
                      {!achievement.unlocked && (
                        <div className="space-y-1">
                          <Progress
                            value={(achievement.progress / achievement.max) * 100}
                          />
                          <p className="text-xs text-muted-foreground">
                            {achievement.progress} / {achievement.max}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
