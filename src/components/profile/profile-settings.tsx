'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Bell, Calendar, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ProfileSettings() {
  // State
  const [notifications, setNotifications] = useState(true)
  const [emailDigest, setEmailDigest] = useState<'daily' | 'weekly' | 'never'>('daily')
  const [weekStartsOn, setWeekStartsOn] = useState<'0' | '1'>('1')
  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>('12h')
  const [enableAI, setEnableAI] = useState(true)

  return (
    <div className="max-w-3xl space-y-8 pb-12">
      {/* Page Header */}
      <div className="space-y-1">
        <h2 className="text-lg font-medium text-foreground">Preferences</h2>
        <p className="text-sm text-muted-foreground">
          Customize how Mentra works for you
        </p>
      </div>

      {/* Notifications */}
      <section className="rounded-2xl border border-border/50 bg-background/60 backdrop-blur-sm">
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-3 text-foreground">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
              Notifications
            </h3>
          </div>

          <div className="space-y-6">
            {/* Push notifications */}
            <div className="flex items-center justify-between gap-6">
              <div className="space-y-1">
                <Label className="text-sm font-medium">
                  Push notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Get notified about due tasks and reminders.
                </p>
              </div>
              <Switch checked={notifications} onCheckedChange={setNotifications} />
            </div>

            {/* Email digest */}
            <div className="flex items-center justify-between gap-6">
              <div className="space-y-1">
                <Label className="text-sm font-medium">
                  Email summary
                </Label>
                <p className="text-sm text-muted-foreground">
                  Receive a summary of your tasks by email.
                </p>
              </div>
              <Select value={emailDigest} onValueChange={setEmailDigest}>
                <SelectTrigger className="w-36 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="never">Never</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {/* Date & Time */}
      <section className="rounded-2xl border border-border/50 bg-background/60 backdrop-blur-sm">
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-3 text-foreground">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
              Date & Time
            </h3>
          </div>

          <div className="space-y-6">
            {/* Week start */}
            <div className="flex items-center justify-between gap-6">
              <div className="space-y-1">
                <Label className="text-sm font-medium">
                  Week starts on
                </Label>
                <p className="text-sm text-muted-foreground">
                  Choose how your calendar is structured.
                </p>
              </div>
              <Select value={weekStartsOn} onValueChange={setWeekStartsOn}>
                <SelectTrigger className="w-36 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Monday</SelectItem>
                  <SelectItem value="0">Sunday</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Time format */}
            <div className="flex items-center justify-between gap-6">
              <div className="space-y-1">
                <Label className="text-sm font-medium">
                  Time format
                </Label>
                <p className="text-sm text-muted-foreground">
                  Display times in your preferred format.
                </p>
              </div>
              <Select value={timeFormat} onValueChange={setTimeFormat}>
                <SelectTrigger className="w-36 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12h">12-hour</SelectItem>
                  <SelectItem value="24h">24-hour</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {/* Intelligence */}
      <section className="rounded-2xl border border-border/50 bg-background/60 backdrop-blur-sm">
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-3 text-foreground">
            <Sparkles className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold tracking-wide uppercase text-muted-foreground">
              Intelligence
            </h3>
          </div>

          <div className="flex items-center justify-between gap-6">
            <div className="space-y-1">
              <Label className="text-sm font-medium">
                AI assistance
              </Label>
              <p className="text-sm text-muted-foreground">
                Help with task parsing, suggestions, and clarity.
              </p>
            </div>
            <Switch checked={enableAI} onCheckedChange={setEnableAI} />
          </div>
        </div>
      </section>
    </div>
  )
}
