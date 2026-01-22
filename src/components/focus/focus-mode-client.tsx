'use client'

import { useState } from 'react'
import { PomodoroTimer } from '@/components/focus/pomodoro-timer'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Maximize2, Minimize2, Target, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Task } from '@prisma/client'

// Remove Task import if not used elsewhere, or keep it.
// Actually, let's just define the interface explicitly.

interface FocusModeClientProps {
    tasks: {
        id: string
        title: string
    }[]
}

export function FocusModeClient({ tasks }: FocusModeClientProps) {
    const [isDistractionFree, setIsDistractionFree] = useState(false)
    const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
    const [completedSessions, setCompletedSessions] = useState(0)
    const [totalFocusTime, setTotalFocusTime] = useState(0)

    const selectedTask = tasks.find(t => t.id === selectedTaskId)

    const handleSessionComplete = (mode: 'focus' | 'shortBreak' | 'longBreak', duration: number) => {
        if (mode === 'focus') {
            setCompletedSessions(prev => prev + 1)
            setTotalFocusTime(prev => prev + duration)
        }
    }

    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600)
        const mins = Math.floor((seconds % 3600) / 60)
        if (hours > 0) {
            return `${hours}h ${mins}m`
        }
        return `${mins}m`
    }

    if (isDistractionFree) {
        return (
            <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center">
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-4 right-4"
                    onClick={() => setIsDistractionFree(false)}
                >
                    <Minimize2 className="h-5 w-5" />
                </Button>

                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold mb-2">Focus Mode</h1>
                    {selectedTask && (
                        <p className="text-muted-foreground">
                            Working on: {selectedTask.title}
                        </p>
                    )}
                </div>

                <PomodoroTimer
                    onSessionComplete={handleSessionComplete}
                    taskTitle={selectedTask?.title}
                />

                <div className="mt-8 flex gap-8 text-center">
                    <div>
                        <p className="text-3xl font-bold">{completedSessions}</p>
                        <p className="text-sm text-muted-foreground">Sessions</p>
                    </div>
                    <div>
                        <p className="text-3xl font-bold">{formatDuration(totalFocusTime)}</p>
                        <p className="text-sm text-muted-foreground">Focus Time</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full p-8 space-y-8 overflow-y-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Focus Mode</h1>
                    <p className="text-muted-foreground mt-1">
                        Deep work with the Pomodoro Technique
                    </p>
                </div>
                <Button onClick={() => setIsDistractionFree(true)} variant="outline">
                    <Maximize2 className="mr-2 h-4 w-4" />
                    Distraction-Free
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Timer */}
                <div className="lg:col-span-2">
                    <PomodoroTimer
                        onSessionComplete={handleSessionComplete}
                        taskTitle={selectedTask?.title}
                    />
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Task Selector */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Target className="h-5 w-5" />
                                Current Focus
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Select
                                value={selectedTaskId || ''}
                                onValueChange={setSelectedTaskId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a task to focus on" />
                                </SelectTrigger>
                                <SelectContent>
                                    {tasks.map(task => (
                                        <SelectItem key={task.id} value={task.id}>
                                            {task.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </CardContent>
                    </Card>

                    {/* Stats */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5" />
                                Today's Stats
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Sessions Completed</span>
                                <span className="font-semibold">{completedSessions}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Total Focus Time</span>
                                <span className="font-semibold">{formatDuration(totalFocusTime)}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tips */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Quick Tips</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="text-sm text-muted-foreground space-y-2">
                                <li>• Work in 25-minute focused bursts</li>
                                <li>• Take short 5-minute breaks</li>
                                <li>• After 4 sessions, take a longer break</li>
                                <li>• Use distraction-free mode for deep work</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
