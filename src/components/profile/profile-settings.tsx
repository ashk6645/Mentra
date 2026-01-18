'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Bell, Moon, Calendar, Globe, Trash2, LogOut, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from 'next-themes'
import { deleteUserAccount } from '@/lib/actions/user'
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

  // State for settings
  const [notifications, setNotifications] = useState(true)
  const [emailDigest, setEmailDigest] = useState('daily')
  const [weekStartsOn, setWeekStartsOn] = useState('0')
  const [timeFormat, setTimeFormat] = useState('12h')
  const [showXP, setShowXP] = useState(true)
  const [showStreaks, setShowStreaks] = useState(true)
  const [enableAI, setEnableAI] = useState(true)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

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
        setIsDeleting(false)
        setShowDeleteDialog(false)
      } else {
        // Success - show toast and redirect
        toast({
          title: 'Account Deleted',
          description: 'Your account has been permanently deleted.',
        })
        
        // Redirect to signup page
        setTimeout(() => {
          router.push('/signup?deleted=true')
          router.refresh()
        }, 1000)
      }
    } catch (error) {
      console.error('Error deleting account:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete account. Please try again.',
        variant: 'destructive',
      })
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize how TaskFlow looks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Theme</Label>
              <p className="text-sm text-muted-foreground">
                Choose your preferred color scheme
              </p>
            </div>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
          <CardDescription>Manage your notification preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Push Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive browser notifications for reminders
              </p>
            </div>
            <Switch checked={notifications} onCheckedChange={setNotifications} />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Digest</Label>
              <p className="text-sm text-muted-foreground">
                Receive summary emails
              </p>
            </div>
            <Select value={emailDigest} onValueChange={setEmailDigest}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="never">Never</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Calendar & Time */}
      <Card>
        <CardHeader>
          <CardTitle>Calendar & Time</CardTitle>
          <CardDescription>Configure date and time settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Week Starts On</Label>
              <p className="text-sm text-muted-foreground">
                First day of the week
              </p>
            </div>
            <Select value={weekStartsOn} onValueChange={setWeekStartsOn}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Sunday</SelectItem>
                <SelectItem value="1">Monday</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Time Format</Label>
              <p className="text-sm text-muted-foreground">
                Display time in 12 or 24 hour format
              </p>
            </div>
            <Select value={timeFormat} onValueChange={setTimeFormat}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12h">12 hour</SelectItem>
                <SelectItem value="24h">24 hour</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Gamification */}
      <Card>
        <CardHeader>
          <CardTitle>Gamification</CardTitle>
          <CardDescription>Control motivation features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show XP & Levels</Label>
              <p className="text-sm text-muted-foreground">
                Display experience points and level progress
              </p>
            </div>
            <Switch checked={showXP} onCheckedChange={setShowXP} />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show Streaks</Label>
              <p className="text-sm text-muted-foreground">
                Display daily streak counters
              </p>
            </div>
            <Switch checked={showStreaks} onCheckedChange={setShowStreaks} />
          </div>
        </CardContent>
      </Card>

      {/* AI Features */}
      <Card>
        <CardHeader>
          <CardTitle>AI Features</CardTitle>
          <CardDescription>Configure AI-powered assistance</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable AI Suggestions</Label>
              <p className="text-sm text-muted-foreground">
                Get intelligent task suggestions and parsing
              </p>
            </div>
            <Switch checked={enableAI} onCheckedChange={setEnableAI} />
          </div>
        </CardContent>
      </Card>

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Manage your account settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" className="w-full" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Log Out
          </Button>

          <Separator />

          <Button 
            variant="destructive" 
            className="w-full"
            onClick={() => setShowDeleteDialog(true)}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting Account...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Account
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground">
            This action cannot be undone. All your data will be permanently deleted.
          </p>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your account
              and remove all your data from our servers including:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>All your tasks and projects</li>
                <li>All your habits and progress</li>
                <li>All your focus sessions</li>
                <li>Your XP, level, and achievements</li>
                <li>Your profile and settings</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete My Account'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
