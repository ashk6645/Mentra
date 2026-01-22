import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { ProjectDatabase } from '@/components/project-database'

export const dynamic = 'force-dynamic'

export default async function ProjectDatabasePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch projects with all necessary data
  const projects = await prisma.project.findMany({
    where: {
      userId: user.id,
      isArchived: false,
    },
    include: {
      area: true,
      tasks: {
        select: {
          id: true,
          title: true,
          description: true,
          completed: true,
          completedAt: true,
          priority: true,
          dueDate: true,
          userId: true,
          projectId: true,
          sectionId: true,
          scheduledStart: true,
          scheduledEnd: true,
          durationMinutes: true,
          xpEarned: true,
          sortOrder: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  })

  // Calculate progress for each project
  const projectsWithProgress = projects.map((project) => {
    const totalTasks = project.tasks.length
    const completedTasks = project.tasks.filter((t) => t.completed).length
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    return {
      ...project,
      progress,
      taskCount: totalTasks,
      completedTaskCount: completedTasks,
    }
  })

  // Fetch areas
  const areas = await prisma.areaOfLife.findMany({
    where: {
      userId: user.id,
    },
    orderBy: {
      name: 'asc',
    },
  })

  return (
    <div className="flex-1 h-full flex flex-col animate-in-fade">
      {/* Page Header - Consistent with Dashboard/Profile */}
      <div className="px-8 py-6 border-b border-border/40 bg-background/50 backdrop-blur-sm sticky top-0 z-20 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage all your projects in one place
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground tabular-nums">
            {projectsWithProgress.length} {projectsWithProgress.length === 1 ? 'project' : 'projects'}
          </span>
        </div>
      </div>

      {/* Project Database */}
      <div className="flex-1 overflow-hidden">
        <ProjectDatabase
          initialProjects={projectsWithProgress}
          initialAreas={areas}
        />
      </div>
    </div>
  )
}