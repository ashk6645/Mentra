'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Edit2, Camera, Mail, Calendar, Upload, Trophy, Zap, Flame } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/lib/hooks'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

export function ProfileHeader() {
  const { user } = useUser()
  const router = useRouter()
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [profile, setProfile] = useState<any>(null)

  const supabase = createClient()

  useEffect(() => {
    if (user) {
      fetchProfile()
    }
  }, [user])

  async function fetchProfile() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single()

      if (data) {
        if (data.avatar_url && data.avatar_url.startsWith('data:image')) {
          await supabase
            .from('profiles')
            .update({ avatar_url: null })
            .eq('id', user?.id)
          data.avatar_url = null
        }

        setProfile(data)
        setDisplayName(data.display_name || user?.email?.split('@')[0] || '')
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const initials = (profile?.display_name || user?.email)?.substring(0, 2).toUpperCase() || 'U'
  const memberSince = user?.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Unknown'

  async function handleUpdateProfile() {
    if (!displayName.trim()) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: displayName })
        .eq('id', user?.id)

      if (error) throw error

      await supabase.auth.updateUser({
        data: { display_name: displayName }
      })

      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      })

      setIsEditing(false)
      await fetchProfile()
      router.refresh()
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
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
      await fetchProfile()
      router.refresh()
      setUploading(false)
    } catch (error: any) {
      console.error('Error uploading avatar:', error)
      toast({ title: 'Error', description: error?.message || 'Failed to upload avatar', variant: 'destructive' })
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col md:flex-row gap-8 items-center md:items-start p-6 bg-card/40 backdrop-blur-sm border border-border/40 rounded-xl">
      <div className="relative group">
        <Avatar className="h-32 w-32 border-4 border-background shadow-sm">
          <AvatarImage src={profile?.avatar_url || user?.user_metadata?.avatar_url} className="object-cover" />
          <AvatarFallback className="text-4xl bg-muted">{initials}</AvatarFallback>
        </Avatar>
        <label htmlFor="avatar-upload">
          <div className={cn(
            "absolute bottom-0 right-0 p-2 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary/90 transition-all shadow-sm",
            uploading && "opacity-50 cursor-not-allowed"
          )}>
            {uploading ? <Upload className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
          </div>
        </label>
        <input
          id="avatar-upload"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarUpload}
          disabled={uploading}
        />
      </div>

      <div className="flex-1 space-y-4 text-center md:text-left">
        <div>
          <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
            <h1 className="text-3xl font-bold tracking-tight">
              {profile?.display_name || user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'User'}
            </h1>
            <Dialog open={isEditing} onOpenChange={setIsEditing}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                  <Edit2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Profile</DialogTitle>
                  <DialogDescription>Update your display name</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Enter your display name"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                  <Button onClick={handleUpdateProfile} disabled={loading || !displayName.trim()}>
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <div className="flex flex-col md:flex-row gap-3 text-sm text-muted-foreground items-center md:items-start">
            <div className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5" />
              {user?.email}
            </div>
            <span className="hidden md:inline text-border">•</span>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Joined {memberSince}
            </div>
          </div>
        </div>

        {/* Quick Stats - Styled as minimal indicators */}
        <div className="flex items-center justify-center md:justify-start gap-6 pt-2">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-yellow-500/10 rounded-full text-yellow-600 dark:text-yellow-400">
              <Trophy className="h-4 w-4" />
            </div>
            <div className="text-left">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Level</p>
              <p className="font-semibold leading-none">{profile?.level || 1}</p>
            </div>
          </div>

          <div className="w-px h-8 bg-border/50" />

          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-500/10 rounded-full text-blue-600 dark:text-blue-400">
              <Zap className="h-4 w-4" />
            </div>
            <div className="text-left">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">XP</p>
              <p className="font-semibold leading-none">{profile?.total_xp || 0}</p>
            </div>
          </div>

          <div className="w-px h-8 bg-border/50" />

          <div className="flex items-center gap-2">
            <div className="p-2 bg-orange-500/10 rounded-full text-orange-600 dark:text-orange-400">
              <Flame className="h-4 w-4" />
            </div>
            <div className="text-left">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Streak</p>
              <p className="font-semibold leading-none">{profile?.current_streak || 0} Days</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
