'use client'

import { Trophy, Star, Target, Flame, CheckCircle2, Clock } from 'lucide-react'
import { AchievementsClient, type Achievement } from './achievements-client'
import { getStreakInfo } from '@/lib/actions/activity'
import { useState, useEffect } from 'react'

export function ProfileAchievements() {
  const [streakInfo, setStreakInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const streakResult = await getStreakInfo()

        if (streakResult.success) {
          setStreakInfo(streakResult)
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

  // Simplified stats - would need proper server actions for real data
  const completedTasks = 0
  const focusSessions = 0
  const totalFocusMinutes = 0
  const streakCount = streakInfo?.currentStreak || 0

  // Define achievements (removed XP-based achievements)
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
      progress: Math.min(streakCount, 3),
      max: 3,
      unlocked: streakCount >= 3,
      category: 'streak'
    },
    {
      id: 'streak-7',
      title: 'Week Warrior',
      description: 'Maintain a 7-day streak',
      icon: <Flame className="h-6 w-6" />,
      progress: Math.min(streakCount, 7),
      max: 7,
      unlocked: streakCount >= 7,
      category: 'streak'
    },
    {
      id: 'streak-30',
      title: 'Monthly Master',
      description: 'Maintain a 30-day streak',
      icon: <Flame className="h-6 w-6" />,
      progress: Math.min(streakCount, 30),
      max: 30,
      unlocked: streakCount >= 30,
      category: 'streak'
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
