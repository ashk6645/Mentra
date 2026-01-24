import { createClient } from '@/lib/supabase/server'
import { Trophy, Star, Target, Zap, Flame, CheckCircle2, Calendar, Clock } from 'lucide-react'
import prisma from '@/lib/prisma'
import { AchievementsClient, type Achievement } from './achievements-client'

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

  return (
    <AchievementsClient
      achievements={achievements}
      unlockedCount={unlockedCount}
    />
  )
}
