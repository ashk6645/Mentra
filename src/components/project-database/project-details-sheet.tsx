'use client'

import React, { useState } from 'react'
import {
  X,
  Calendar,
  Flag,
  Tag,
  Trash2,
  MoreHorizontal,
  ExternalLink,
  Copy,
  Archive,
  Star,
  ListChecks,
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useProjectDatabase } from './project-database-context'
import { StatusBadge, PriorityBadge, AreaBadge, ProgressBar } from './cell-renderers'
import { InlineEditCell } from './inline-edit-cell'
import { ProjectDatabaseItem } from './types'

// ========================================
// PROJECT DETAILS SHEET
// ========================================

interface ProjectDetailsSheetProps {
  project: ProjectDatabaseItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ProjectDetailsSheet({
  project,
  open,
  onOpenChange,
}: ProjectDetailsSheetProps) {
  if (!project) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0">
        <SheetTitle className="sr-only">
          {project.name} - Project Details
        </SheetTitle>
        <ProjectDetailsContent project={project} onClose={() => onOpenChange(false)} />
      </SheetContent>
    </Sheet>
  )
}

// ========================================
// PROJECT DETAILS CONTENT
// ========================================

interface ProjectDetailsContentProps {
  project: ProjectDatabaseItem
  onClose: () => void
}

function ProjectDetailsContent({ project, onClose }: ProjectDetailsContentProps) {
  const { updateProject, deleteProject, areas } = useProjectDatabase()
  const [isEditing, setIsEditing] = useState(false)
  const [editedName, setEditedName] = useState(project.name)
  const [editedDescription, setEditedDescription] = useState(project.description || '')

  const area = areas.find((a) => a.id === project.areaId)

  const handleSave = async () => {
    await updateProject(project.id, {
      name: editedName,
      description: editedDescription,
    })
    setIsEditing(false)
  }

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this project?')) {
      await deleteProject(project.id)
      onClose()
    }
  }

  const handleDuplicate = async () => {
    // TODO: Implement duplicate
    console.log('Duplicate project:', project.id)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center gap-2">
          {project.icon && (
            <span className="text-2xl">{project.icon}</span>
          )}
          <h2 className="text-lg font-semibold">Project Details</h2>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleDuplicate}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem>
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in new tab
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="px-6 py-6 space-y-6">
          {/* Title & Description */}
          <div className="space-y-4">
            {isEditing ? (
              <>
                <Input
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="text-2xl font-bold border-none px-0 focus-visible:ring-0"
                  placeholder="Project name..."
                />
                <Textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  className="min-h-[100px] resize-none"
                  placeholder="Add a description..."
                />
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={handleSave}>
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setIsEditing(false)
                      setEditedName(project.name)
                      setEditedDescription(project.description || '')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h1
                  className="text-2xl font-bold cursor-pointer hover:text-muted-foreground"
                  onClick={() => setIsEditing(true)}
                >
                  {project.name}
                </h1>
                <p
                  className="text-muted-foreground cursor-pointer hover:text-foreground"
                  onClick={() => setIsEditing(true)}
                >
                  {project.description || 'Add a description...'}
                </p>
              </>
            )}
          </div>

          <Separator />

          {/* Properties */}
          <div className="space-y-4">
            <h3 className="font-semibold text-sm">Properties</h3>

            {/* Status */}
            <PropertyRow label="Status" icon={<Flag className="h-4 w-4" />}>
              <StatusBadge status={project.status} size="md" />
            </PropertyRow>

            {/* Priority */}
            <PropertyRow label="Priority" icon={<Flag className="h-4 w-4" />}>
              <PriorityBadge priority={project.priority} size="md" />
            </PropertyRow>

            {/* Area */}
            {area && (
              <PropertyRow label="Area" icon={<Tag className="h-4 w-4" />}>
                <AreaBadge area={area} size="md" />
              </PropertyRow>
            )}

            {/* Start Date */}
            <PropertyRow label="Start Date" icon={<Calendar className="h-4 w-4" />}>
              <span className="text-sm">
                {project.startDate
                  ? format(new Date(project.startDate), 'MMM dd, yyyy')
                  : 'Not set'}
              </span>
            </PropertyRow>

            {/* Target Date */}
            <PropertyRow label="Target Date" icon={<Calendar className="h-4 w-4" />}>
              <span className="text-sm">
                {project.targetDate
                  ? format(new Date(project.targetDate), 'MMM dd, yyyy')
                  : 'Not set'}
              </span>
            </PropertyRow>

            {/* Progress */}
            <PropertyRow label="Progress" icon={<ListChecks className="h-4 w-4" />}>
              <div className="flex-1">
                <ProgressBar value={project.progress} size="md" />
              </div>
            </PropertyRow>
          </div>

          <Separator />

          {/* Tasks Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Tasks</h3>
              <Button variant="outline" size="sm">
                <ListChecks className="h-4 w-4 mr-2" />
                View all
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              {project.taskCount || 0} tasks, {project.completedTaskCount || 0} completed
            </div>
          </div>

          <Separator />

          {/* Metadata */}
          <div className="space-y-2 text-xs text-muted-foreground">
            <div>Created {format(new Date(project.createdAt), 'MMM dd, yyyy')}</div>
            <div>Last updated {format(new Date(project.updatedAt), 'MMM dd, yyyy')}</div>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}

// ========================================
// PROPERTY ROW
// ========================================

interface PropertyRowProps {
  label: string
  icon: React.ReactNode
  children: React.ReactNode
}

function PropertyRow({ label, icon, children }: PropertyRowProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2 w-32 text-sm text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  )
}
