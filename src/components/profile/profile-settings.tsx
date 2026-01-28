'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Moon, Bell, Calendar, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from 'next-themes'
import { useToast } from '@/components/ui/use-toast'

export function ProfileSettings() {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const supabase = createClient()
  const { toast } = useToast()

  // State
  const [notifications, setNotifications] = useState(true)
  const [emailDigest, setEmailDigest] = useState('daily')
  const [weekStartsOn, setWeekStartsOn] = useState('0')
  const [timeFormat, setTimeFormat] = useState('12h')
  const [showXP, setShowXP] = useState(true)
  const [showStreaks, setShowStreaks] = useState(true)
  const [enableAI, setEnableAI] = useState(true)

  return (
    <div className="max-w-4xl space-y-10 pb-10">

      {/* Appearance */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-foreground/80">
          <Moon className="h-5 w-5" />
          <h3 className="text-lg font-medium">Appearance</h3>
        </div>
        <Separator className="bg-border/50" />
        <div className="grid gap-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Theme</Label>
              <p className="text-sm text-muted-foreground">Choose your preferred visual, dark or light.</p>
            </div>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger className="w-36 bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      {/* Notifications */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-foreground/80">
          <Bell className="h-5 w-5" />
          <h3 className="text-lg font-medium">Notifications</h3>
        </div>
        <Separator className="bg-border/50" />
        <div className="grid gap-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Push Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive browser notifications for due dates.</p>
            </div>
            <Switch checked={notifications} onCheckedChange={setNotifications} />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Email Digest</Label>
              <p className="text-sm text-muted-foreground">How often do you want to receive summaries?</p>
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
      </section>

      {/* Preferences */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-foreground/80">
          <Calendar className="h-5 w-5" />
          <h3 className="text-lg font-medium">Preferences</h3>
        </div>
        <Separator className="bg-border/50" />
        <div className="grid gap-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Week Starts On</Label>
              <p className="text-sm text-muted-foreground">Adjust calendar start day.</p>
            </div>
            <Select value={weekStartsOn} onValueChange={setWeekStartsOn}>
              <SelectTrigger className="w-36 bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Sunday</SelectItem>
                <SelectItem value="1">Monday</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Time Format</Label>
              <p className="text-sm text-muted-foreground">12-hour or 24-hour clock.</p>
            </div>
            <Select value={timeFormat} onValueChange={setTimeFormat}>
              <SelectTrigger className="w-36 bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12h">12 Hour</SelectItem>
                <SelectItem value="24h">24 Hour</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

      </section>

      {/* Features */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-foreground/80">
          <Sparkles className="h-5 w-5" />
          <h3 className="text-lg font-medium">Features</h3>
        </div>
        <Separator className="bg-border/50" />
        <div className="grid gap-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Gamification</Label>
              <p className="text-sm text-muted-foreground">Show XP, Levels, and Streaks.</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Label className="text-xs font-normal text-muted-foreground">XP</Label>
                <Switch checked={showXP} onCheckedChange={setShowXP} />
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs font-normal text-muted-foreground">Streaks</Label>
                <Switch checked={showStreaks} onCheckedChange={setShowStreaks} />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">AI Suggestions</Label>
              <p className="text-sm text-muted-foreground">Enable intelligent task parsing.</p>
            </div>
            <Switch checked={enableAI} onCheckedChange={setEnableAI} />
          </div>
        </div>
      </section>
    </div>
  )
}