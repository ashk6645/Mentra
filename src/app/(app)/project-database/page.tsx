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
          completed: true,
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
    <div className="h-screen flex flex-col">
      {/* Page Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Projects Database</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage all your projects in one place with multiple views
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {projectsWithProgress.length} projects
            </span>
          </div>
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