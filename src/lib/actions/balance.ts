'use server'

import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'

export async function getBalanceData() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return []

    try {
        // Get all areas with their projects
        const areas = await prisma.areaOfLife.findMany({
            where: { userId: user.id },
            include: {
                projects: {
                    include: {
                        tasks: {
                            select: {
                                id: true,
                                completed: true
                            }
                        }
                    }
                }
            }
        })

        // Calculate stats for each area
        return areas.map(area => {
            let taskCount = 0
            let completedCount = 0

            area.projects.forEach(project => {
                taskCount += project.tasks.length
                completedCount += project.tasks.filter(t => t.completed).length
            })

            return {
                name: area.name,
                color: area.color || 'gray',
                taskCount,
                completedCount,
                percentage: taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 0
            }
        })
    } catch (error) {
        console.error('Failed to get balance data:', error)
        return []
    }
}
