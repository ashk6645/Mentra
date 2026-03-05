'use client'

import { useState, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useUser } from '@/lib/hooks'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
    updateUserProfile,
    deleteUserAccount,
    resetUserAccount
} from '@/lib/actions/user'
import { useToast } from '@/components/ui/use-toast'
import {
    Loader2,
    LogOut,
    Camera,
    AlertTriangle,
    Calendar
} from 'lucide-react'
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
import { cn } from '@/lib/utils'

export function ProfileAccount() {
    const { user } = useUser()
    const router = useRouter()
    const supabase = createClient()
    const { toast } = useToast()

    const [displayName, setDisplayName] = useState(user?.user_metadata?.display_name || '')
    const [profile, setProfile] = useState<any>(null)

    const [uploading, setUploading] = useState(false)
    const [isUpdating, setIsUpdating] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [isResetting, setIsResetting] = useState(false)

    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [showResetDialog, setShowResetDialog] = useState(false)

    const email = user?.email
    const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url
    const initials = (displayName || email || 'U').slice(0, 2).toUpperCase()
    const memberSince = user?.created_at
        ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
        : '—'

    useEffect(() => {
        if (user) fetchProfile()
    }, [user])

    async function fetchProfile() {
        const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user?.id)
            .single()

        if (data) setProfile(data)
    }

    async function handleUpdateProfile() {
        setIsUpdating(true)
        const result = await updateUserProfile({ displayName })

        if (result?.error) {
            toast({ title: 'Error', description: result.error, variant: 'destructive' })
        } else {
            toast({ title: 'Profile updated' })
            router.refresh()
        }

        setIsUpdating(false)
    }

    async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
        if (!e.target.files?.[0]) return

        try {
            setUploading(true)
            const file = e.target.files[0]

            if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
                toast({ title: 'Invalid image', description: 'Upload an image under 5MB', variant: 'destructive' })
                return
            }

            const ext = file.name.split('.').pop()
            const path = `avatars/${user?.id}-${Date.now()}.${ext}`

            await supabase.storage.from('avatars').upload(path, file, { upsert: true })
            const { data } = supabase.storage.from('avatars').getPublicUrl(path)

            await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', user?.id)

            toast({ title: 'Avatar updated' })
            fetchProfile()
            router.refresh()
        } finally {
            setUploading(false)
        }
    }

    async function handleLogout() {
        await supabase.auth.signOut()
        router.push('/login')
        router.refresh()
    }

    async function handleResetAccount() {
        setIsResetting(true)
        await resetUserAccount()
        window.location.reload()
    }

    async function handleDeleteAccount() {
        setIsDeleting(true)
        await deleteUserAccount()
        router.push('/signup')
    }

    return (
        <div className="max-w-2xl space-y-12 pb-16">
            {/* Header */}
            <div className="space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight">Account</h1>
                <p className="text-sm text-muted-foreground">
                    Manage your personal information and preferences
                </p>
            </div>

            {/* Profile Card */}
            <div className="rounded-2xl border border-border/50 bg-background/60 backdrop-blur-xl p-6">
                <div className="flex items-center gap-6">
                    {/* Avatar */}
                    <label className="relative group cursor-pointer">
                        <Avatar className="h-24 w-24 border border-border/50">
                            <AvatarImage src={avatarUrl} />
                            <AvatarFallback className="text-xl">{initials}</AvatarFallback>
                        </Avatar>

                        <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                            {uploading ? (
                                <Loader2 className="h-5 w-5 animate-spin text-white" />
                            ) : (
                                <Camera className="h-5 w-5 text-white" />
                            )}
                        </div>

                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarUpload}
                        />
                    </label>

                    {/* Info */}
                    <div className="flex-1 space-y-4">
                        <div className="space-y-1">
                            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                                Display name
                            </Label>
                            <div className="flex gap-2">
                                <Input
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    className="h-9"
                                />
                                <Button
                                    size="sm"
                                    disabled={isUpdating}
                                    onClick={handleUpdateProfile}
                                >
                                    {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save'}
                                </Button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">Email</p>
                                <p className="font-medium truncate">{email}</p>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-wide text-muted-foreground">Member since</p>
                                <p className="font-medium flex items-center gap-1">
                                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                    {memberSince}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Account Actions */}
            <div className="space-y-4">
                <h3 className="text-xs uppercase tracking-wide text-muted-foreground">
                    Account actions
                </h3>

                <div className="rounded-xl border border-border/50 divide-y bg-background">
                    <div className="p-4 flex items-center justify-between">
                        <div>
                            <p className="font-medium">Log out</p>
                            <p className="text-xs text-muted-foreground">
                                Sign out on this device
                            </p>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleLogout}>
                            <LogOut className="h-4 w-4 mr-2" />
                            Log out
                        </Button>
                    </div>

                    <div className="p-4 space-y-3 bg-muted/30">
                        <div className="flex items-center justify-between">
                            <p className="text-sm">Reset account data</p>
                            <Button variant="ghost" size="sm" onClick={() => setShowResetDialog(true)}>
                                Reset
                            </Button>
                        </div>

                        <div className="flex items-center justify-between">
                            <p className="text-sm">Delete account</p>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive"
                                onClick={() => setShowDeleteDialog(true)}
                            >
                                Delete
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Dialogs */}
            <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Reset account?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete all tasks and data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleResetAccount}>
                            {isResetting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Reset'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete account?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteAccount}
                            className="bg-destructive text-white"
                        >
                            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
