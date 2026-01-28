'use client'

import { Trophy, Star, Target, Zap, Flame, CheckCircle2, Clock } from 'lucide-react'
import { AchievementsClient, type Achievement } from './achievements-client'
import { getUserStats, getAchievementStats } from '@/lib/actions/gamification'
import { useState, useEffect } from 'react'

export function ProfileAchievements() {
  const [stats, setStats] = useState<any>(null)
  const [achievementStats, setAchievementStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsResult, achievementResult] = await Promise.all([
          getUserStats(),
          getAchievementStats()
        ])

        if (statsResult.success) {
          setStats(statsResult.data)
        }

        if (achievementResult.success) {
          setAchievementStats(achievementResult.data)
        }
      } catch (error) {
        console.error('Error fetching achievement data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return <div className="p-12 text-center text-muted-foreground">Loading achievements...</div>
  }

  const completedTasks = achievementStats?.completedTasks || 0
  const focusSessions = achievementStats?.focusSessions || 0
  const totalFocusMinutes = achievementStats?.totalFocusMinutes || 0

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
      progress: Math.min(stats?.streakCount || 0, 3),
      max: 3,
      unlocked: (stats?.streakCount || 0) >= 3,
      category: 'streak'
    },
    {
      id: 'streak-7',
      title: 'Week Warrior',
      description: 'Maintain a 7-day streak',
      icon: <Flame className="h-6 w-6" />,
      progress: Math.min(stats?.streakCount || 0, 7),
      max: 7,
      unlocked: (stats?.streakCount || 0) >= 7,
      category: 'streak'
    },
    {
      id: 'streak-30',
      title: 'Monthly Master',
      description: 'Maintain a 30-day streak',
      icon: <Flame className="h-6 w-6" />,
      progress: Math.min(stats?.streakCount || 0, 30),
      max: 30,
      unlocked: (stats?.streakCount || 0) >= 30,
      category: 'streak'
    },

    // XP Achievements
    {
      id: 'xp-100',
      title: 'Beginner',
      description: 'Earn 100 XP',
      icon: <Zap className="h-6 w-6" />,
      progress: Math.min(stats?.xp || 0, 100),
      max: 100,
      unlocked: (stats?.xp || 0) >= 100,
      category: 'xp'
    },
    {
      id: 'xp-500',
      title: 'Experienced',
      description: 'Earn 500 XP',
      icon: <Zap className="h-6 w-6" />,
      progress: Math.min(stats?.xp || 0, 500),
      max: 500,
      unlocked: (stats?.xp || 0) >= 500,
      category: 'xp'
    },
    {
      id: 'xp-1000',
      title: 'Expert',
      description: 'Earn 1,000 XP',
      icon: <Zap className="h-6 w-6" />,
      progress: Math.min(stats?.xp || 0, 1000),
      max: 1000,
      unlocked: (stats?.xp || 0) >= 1000,
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
      progress: Math.min(totalFocusMinutes, 600),
      max: 600,
      unlocked: totalFocusMinutes >= 600,
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
