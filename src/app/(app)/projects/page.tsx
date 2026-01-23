import { getProjectsForBoard } from '@/lib/actions/projects'
import { ProjectBoard } from '@/components/projects/project-board'
import { Button } from '@/components/ui/button'
import { Filter, ArrowUpDown, Zap, Search, LayoutGrid, List } from 'lucide-react'
import { CreateProjectDialog } from '@/components/projects/create-project-dialog'

export default async function ProjectsPage() {
    const projects = await getProjectsForBoard()

    return (
        <div className="flex-1 h-full flex flex-col bg-background">
            {/* Page Header matching the image 'Projects' header style */}
            <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur z-10">
                <div className="flex items-center gap-4">
                    <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                        Projects
                    </h1>

                    <div className="h-4 w-px bg-border mx-1" />

                    <div className="flex bg-muted/50 p-0.5 rounded-md gap-0.5">
                        <Button variant="secondary" size="sm" className="h-7 px-3 text-xs bg-background shadow-sm hover:bg-background">
                            <LayoutGrid className="mr-1.5 h-3.5 w-3.5" />
                            Board
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 px-3 text-xs text-muted-foreground">
                            <List className="mr-1.5 h-3.5 w-3.5" />
                            List
                        </Button>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="h-8 gap-2 text-muted-foreground">
                        <Filter className="h-4 w-4" />
                        By Status
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 gap-2 text-muted-foreground">
                        <ArrowUpDown className="h-4 w-4" />
                        Sort
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                        <Search className="h-4 w-4" />
                    </Button>

                    <div className="ml-2">
                        <CreateProjectDialog />
                    </div>
                </div>
            </div>

            {/* Board Content */}
            <ProjectBoard projects={projects as any} />
        </div>
    )
}
