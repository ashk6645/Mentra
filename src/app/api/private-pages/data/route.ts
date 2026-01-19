import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const source = searchParams.get('source')

        if (!source) {
            return NextResponse.json({ error: 'Source type required' }, { status: 400 })
        }

        let data: any[] = []

        switch (source.toUpperCase()) {
            case 'TASKS':
                const tasks = await prisma.task.findMany({
                    where: { userId: user.id },
                    select: {
                        id: true,
                        title: true,
                        priority: true,
                        dueDate: true,
                        completed: true,
                        completedAt: true,
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 50,
                })
                // Add computed status field
                data = tasks.map(t => ({
                    ...t,
                    status: t.completed ? 'DONE' : 'TODO',
                }))
                break

            case 'PROJECTS':
                const projects = await prisma.project.findMany({
                    where: { userId: user.id },
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        status: true,
                        color: true,
                        icon: true,
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 50,
                })
                // Map name to title for consistency
                data = projects.map(p => ({ ...p, title: p.name }))
                break

            case 'HABITS':
                const habits = await prisma.habit.findMany({
                    where: { userId: user.id },
                    select: {
                        id: true,
                        name: true,
                        frequency: true,
                        currentStreak: true,
                        icon: true,
                        color: true,
                        isActive: true,
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 50,
                })
                // Map fields for consistency
                data = habits.map(h => ({
                    ...h,
                    title: h.name,
                    streak: h.currentStreak,
                    status: h.isActive ? 'Active' : 'Inactive',
                }))
                break

            default:
                return NextResponse.json({ error: 'Invalid source type' }, { status: 400 })
        }

        return NextResponse.json({ data })
    } catch (error) {
        console.error('Error fetching data:', error)
        return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
    }
}
