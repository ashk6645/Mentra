'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Trash2, LogOut, Loader2, Moon, Bell, Calendar, Trophy, Sparkles } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from 'next-themes'
import { deleteUserAccount, resetUserAccount } from '@/lib/actions/user'
import { useToast } from '@/components/ui/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  async function handleDeleteAccount() {
    setIsDeleting(true)
    try {
      const result = await deleteUserAccount()
      if (result.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Account Deleted',
          description: 'Your account has been permanently deleted.',
        })
        setTimeout(() => {
          router.push('/signup?deleted=true')
        }, 1000)
      }
    } catch (error) {
      console.error('Error deleting account:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete account.',
        variant: 'destructive',
      })
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  async function handleResetAccount() {
    setIsResetting(true)
    try {
      const result = await resetUserAccount()
      if (result.error) {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Account Reset',
          description: 'Your account data has been cleared successfully.',
        })
        // Refresh to reflect empty state
        router.refresh()
        // Optional: redirect to dashboard to show it's empty
        setTimeout(() => {
          router.push('/dashboard')
        }, 1000)
      }
    } catch (error) {
      console.error('Error resetting account:', error)
      toast({
        title: 'Error',
        description: 'Failed to reset account.',
        variant: 'destructive',
      })
    } finally {
      setIsResetting(false)
      setShowResetDialog(false)
    }
  }

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

      {/* Danger Zone */}
      <section className="space-y-4 pt-4">
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
          <h3 className="text-lg font-medium text-destructive mb-4">Danger Zone</h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Sign Out</h4>
                <p className="text-sm text-muted-foreground">Log out of your account on this device.</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" /> Sign Out
              </Button>
            </div>

            <Separator className="bg-destructive/10" />

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-amber-600 dark:text-amber-500">Reset Account</h4>
                <p className="text-sm text-muted-foreground">Clear all data but keep your account.</p>
              </div>
              <Button variant="outline" className="text-amber-600 border-amber-200 hover:bg-amber-50 hover:text-amber-700 dark:border-amber-900/50 dark:hover:bg-amber-950/30" size="sm" onClick={() => setShowResetDialog(true)} disabled={isResetting || isDeleting}>
                Reset Data
              </Button>
            </div>

            <Separator className="bg-destructive/10" />

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-destructive">Delete Account</h4>
                <p className="text-sm text-muted-foreground">Permanently delete your account and all data.</p>
              </div>
              <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)} disabled={isDeleting}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete Account
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Delete Dialog - (Unchanged logic, just structure) */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. All your data will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAccount} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Delete My Account'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Account Data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all your Tasks, Projects, Habits, and XP.
              <br /><br />
              <strong>Your account login will remain active</strong>, but you will start from scratch like a new user.
              <br /><br />
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isResetting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetAccount} disabled={isResetting} className="bg-amber-600 hover:bg-amber-700 text-white">
              {isResetting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Yes, Clear All Data'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}