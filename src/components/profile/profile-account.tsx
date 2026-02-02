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
    Trash2,
    Camera,
    AlertTriangle,
    Calendar,
    Upload
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
    const [isUpdating, setIsUpdating] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [isResetting, setIsResetting] = useState(false)
    const [profile, setProfile] = useState<any>(null)

    // Dialog states
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [showResetDialog, setShowResetDialog] = useState(false)

    const email = user?.email
    const avatarUrl = user?.user_metadata?.avatar_url
    const initials = (displayName || email || 'U').substring(0, 2).toUpperCase()
    const memberSince = user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Unknown'

    const [uploading, setUploading] = useState(false)

    useEffect(() => {
        if (user) {
            fetchStats()
        }
    }, [user])

    async function fetchStats() {
        try {
            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user?.id)
                .single()

            if (data) setProfile(data)
        } catch (error) {
            console.error(error)
        }
    }

    async function handleUpdateProfile() {
        setIsUpdating(true)
        try {
            const result = await updateUserProfile({ displayName })
            if (result.error) {
                toast({
                    title: "Error",
                    description: result.error,
                    variant: "destructive"
                })
            } else {
                toast({
                    title: "Success",
                    description: "Profile updated successfully"
                })
                router.refresh()
            }
        } catch (error) {
            toast({
                title: "Error",
                description: "Something went wrong",
                variant: "destructive"
            })
        } finally {
            setIsUpdating(false)
        }
    }

    async function handleAvatarUpload(event: React.ChangeEvent<HTMLInputElement>) {
        try {
            setUploading(true)
            if (!event.target.files || event.target.files.length === 0) {
                setUploading(false)
                return
            }

            const file = event.target.files[0]
            if (file.size > 5 * 1024 * 1024) {
                toast({ title: 'Error', description: 'Image must be less than 5MB', variant: 'destructive' })
                setUploading(false)
                return
            }

            if (!file.type.startsWith('image/')) {
                toast({ title: 'Error', description: 'Please upload an image file', variant: 'destructive' })
                setUploading(false)
                return
            }

            const fileExt = file.name.split('.').pop()
            const fileName = `${user?.id}-${Date.now()}.${fileExt}`
            const filePath = `avatars/${fileName}`

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, { cacheControl: '3600', upsert: true })

            if (uploadError) {
                if (uploadError.message.includes('not found') || uploadError.message.includes('Bucket')) {
                    toast({ title: 'Storage not configured', description: 'Please create an "avatars" bucket', variant: 'destructive' })
                } else {
                    throw uploadError
                }
                setUploading(false)
                return
            }

            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath)

            const { error: updateError } = await supabase
                .from('profiles')
                .update({ avatar_url: publicUrl })
                .eq('id', user?.id)

            if (updateError) throw updateError

            toast({ title: 'Success', description: 'Avatar updated successfully' })
            // Refresh stats to get new profile data if needed, or just router refresh
            await fetchStats()
            router.refresh()
            setUploading(false)
        } catch (error: any) {
            console.error('Error uploading avatar:', error)
            toast({ title: 'Error', description: error?.message || 'Failed to upload avatar', variant: 'destructive' })
            setUploading(false)
        }
    }

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
                    title: "Error",
                    description: result.error,
                    variant: "destructive"
                })
            } else {
                toast({
                    title: "Account Deleted",
                    description: "Your account has been deleted"
                })
                router.push('/signup')
            }
        } catch (error) {
            console.error(error)
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
                    title: "Error",
                    description: result.error,
                    variant: "destructive"
                })
            } else {
                toast({
                    title: "Account Reset",
                    description: "All data cleared successfully"
                })
                router.refresh()
                // Redirect or reload
                window.location.reload()
            }
        } catch (error) {
            console.error(error)
        } finally {
            setIsResetting(false)
            setShowResetDialog(false)
        }
    }

    return (
        <div className="space-y-10 pb-12 max-w-2xl">
            {/* Header */}
            <div>
                <h2 className="text-lg font-medium text-[#37352F] dark:text-[#D4D4D4] mb-1">My Profile</h2>
                <p className="text-sm text-[#91918E] dark:text-[#818181]">Manage your personal information</p>
            </div>

            {/* Profile Photo & Info */}
            <div className="flex items-start gap-6">
                <div className="relative group cursor-pointer">
                    <Avatar className="h-24 w-24 rounded-full border border-border/25">
                        <AvatarImage src={profile?.avatar_url || avatarUrl} />
                        <AvatarFallback className="text-2xl bg-muted text-muted-foreground">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <label htmlFor="account-avatar-upload" className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        {uploading ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Camera className="w-6 h-6 text-white" />}
                    </label>
                    <input
                        id="account-avatar-upload"
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        disabled={uploading}
                    />
                </div>

                <div className="flex-1 space-y-4 max-w-md">
                    <div className="space-y-1.5">
                        <Label htmlFor="display-name" className="text-xs font-semibold text-[#91918E] dark:text-[#818181] uppercase tracking-wide">
                            Preferred Name
                        </Label>
                        <div className="flex gap-2">
                            <Input
                                id="display-name"
                                value={displayName}
                                onChange={(e) => setDisplayName(e.target.value)}
                                className="h-9 bg-transparent border-[#E9E9E8] dark:border-[#2C2C2C] focus-visible:ring-1 focus-visible:ring-[#37352F]"
                            />
                            <Button
                                size="sm"
                                onClick={handleUpdateProfile}
                                disabled={isUpdating || displayName === user?.user_metadata?.display_name}
                                className="h-9 bg-[#37352F] text-white hover:bg-[#37352F]/90 dark:bg-[#D4D4D4] dark:text-[#37352F]"
                            >
                                {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Update'}
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-[#91918E] dark:text-[#818181] uppercase tracking-wide">
                                Email
                            </Label>
                            <div className="text-sm text-[#37352F] dark:text-[#D4D4D4] font-medium py-1.5 truncate">
                                {email}
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs font-semibold text-[#91918E] dark:text-[#818181] uppercase tracking-wide">
                                Joined
                            </Label>
                            <div className="flex items-center gap-1.5 text-sm text-[#37352F] dark:text-[#D4D4D4] font-medium py-1.5">
                                <Calendar className="w-3.5 h-3.5 text-[#91918E]" />
                                {memberSince}
                            </div>
                        </div>
                    </div>
                </div>
            </div>



            <Separator className="bg-[#E9E9E8] dark:bg-[#2C2C2C]" />

            {/* Account Management */}
            <div className="space-y-6">
                <h3 className="text-sm font-semibold text-[#91918E] dark:text-[#818181] uppercase tracking-wide">
                    Account Actions
                </h3>

                <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 rounded-lg bg-[#F7F7F5] dark:bg-[#191919] border border-[#E9E9E8] dark:border-[#2C2C2C]">
                        <div>
                            <h4 className="text-sm font-medium text-[#37352F] dark:text-[#D4D4D4]">Log Out</h4>
                            <p className="text-xs text-[#91918E] dark:text-[#818181] mt-0.5">
                                Sign out of your account on this device
                            </p>
                        </div>
                        <Button variant="outline" size="sm" onClick={handleLogout} className="h-8 border-[#E9E9E8] dark:border-[#2C2C2C]">
                            <LogOut className="w-3.5 h-3.5 mr-2" />
                            Log Out
                        </Button>
                    </div>

                    <div className="border border-red-200 dark:border-red-900/30 rounded-lg overflow-hidden">
                        <div className="bg-red-50 dark:bg-red-950/10 px-4 py-3 border-b border-red-100 dark:border-red-900/30 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400" />
                            <span className="text-sm font-semibold text-red-700 dark:text-red-400">Danger Zone</span>
                        </div>

                        <div className="p-4 bg-white dark:bg-[#191919] space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-sm font-medium text-[#37352F] dark:text-[#D4D4D4]">Reset Account</h4>
                                    <p className="text-xs text-[#91918E] dark:text-[#818181] mt-0.5">
                                        Clear all data but keep your account
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowResetDialog(true)}
                                    className="h-8 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:text-amber-500"
                                >
                                    Reset Data
                                </Button>
                            </div>

                            <Separator className="bg-[#E9E9E8] dark:bg-[#2C2C2C]" />

                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-sm font-medium text-[#37352F] dark:text-[#D4D4D4]">Delete Account</h4>
                                    <p className="text-xs text-[#91918E] dark:text-[#818181] mt-0.5">
                                        Permanently remove your account and data
                                    </p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowDeleteDialog(true)}
                                    className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-500"
                                >
                                    Delete Account
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Dialogs */}
            <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Reset Account Data?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete all your tasks, projects, habits, and progress.
                            You cannot undo this action.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleResetAccount} className="bg-amber-600 hover:bg-amber-700">
                            {isResetting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Yes, Reset Data'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Account?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete your account and remove your data from our servers.
                            You cannot undo this action.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAccount} className="bg-red-600 hover:bg-red-700">
                            {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete Account'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
