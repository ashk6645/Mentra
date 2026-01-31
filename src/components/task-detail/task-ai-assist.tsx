'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sparkles, ChevronDown, ChevronUp, ListTree, Wand2, Clock, Flag } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Task {
  id: string
  title: string
}

interface TaskAIAssistProps {
  task: Task
}

export function TaskAIAssist({ task }: TaskAIAssistProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleAIAction = async (action: string) => {
    setIsLoading(true)
    
    try {
      const response = await fetch(`/api/tasks/${task.id}/ai`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, taskTitle: task.title }),
      })

      if (response.ok) {
        const result = await response.json()
        // Handle result based on action
        console.log('AI result:', result)
      }
    } catch (error) {
      console.error('AI action failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full p-3 rounded-lg border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all group"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium">AI Assist</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        )}
      </button>

      {isExpanded && (
        <div className="space-y-2 pl-4 border-l-2 border-primary/20">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleAIAction('break-into-subtasks')}
            disabled={isLoading}
            className="w-full justify-start h-auto py-3 text-left"
          >
            <ListTree className="mr-3 h-4 w-4 shrink-0 text-primary" />
            <div className="flex-1">
              <div className="font-medium text-sm">Break into subtasks</div>
              <div className="text-xs text-muted-foreground">
                AI suggests logical steps
              </div>
            </div>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleAIAction('rewrite-clearly')}
            disabled={isLoading}
            className="w-full justify-start h-auto py-3 text-left"
          >
            <Wand2 className="mr-3 h-4 w-4 shrink-0 text-primary" />
            <div className="flex-1">
              <div className="font-medium text-sm">Rewrite clearly</div>
              <div className="text-xs text-muted-foreground">
                Make task title more actionable
              </div>
            </div>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleAIAction('estimate-time')}
            disabled={isLoading}
            className="w-full justify-start h-auto py-3 text-left"
          >
            <Clock className="mr-3 h-4 w-4 shrink-0 text-primary" />
            <div className="flex-1">
              <div className="font-medium text-sm">Estimate time</div>
              <div className="text-xs text-muted-foreground">
                How long will this take?
              </div>
            </div>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleAIAction('suggest-priority')}
            disabled={isLoading}
            className="w-full justify-start h-auto py-3 text-left"
          >
            <Flag className="mr-3 h-4 w-4 shrink-0 text-primary" />
            <div className="flex-1">
              <div className="font-medium text-sm">Suggest priority</div>
              <div className="text-xs text-muted-foreground">
                Based on urgency and impact
              </div>
            </div>
          </Button>

          {isLoading && (
            <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
              <span>AI is thinking...</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
