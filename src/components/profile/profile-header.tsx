'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Edit2, Camera, Mail, Calendar, Trophy, Zap, Upload } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/lib/hooks'
import { useToast } from '@/components/ui/use-toast'

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
        // If avatar_url contains base64 data, clear it
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

      // Also update auth metadata
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
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Error',
          description: 'Image must be less than 5MB',
          variant: 'destructive',
        })
        setUploading(false)
        return
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Error',
          description: 'Please upload an image file',
          variant: 'destructive',
        })
        setUploading(false)
        return
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { 
          cacheControl: '3600',
          upsert: true 
        })

      if (uploadError) {
        // If bucket doesn't exist, show helpful message
        if (uploadError.message.includes('not found') || uploadError.message.includes('Bucket')) {
          toast({
            title: 'Storage not configured',
            description: 'Please create an "avatars" bucket in Supabase Storage first',
            variant: 'destructive',
          })
        } else {
          throw uploadError
        }
        setUploading(false)
        return
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user?.id)

      if (updateError) throw updateError

      toast({
        title: 'Success',
        description: 'Avatar updated successfully',
      })

      await fetchProfile()
      router.refresh()
      setUploading(false)
    } catch (error: any) {
      console.error('Error uploading avatar:', error)
      toast({
        title: 'Error',
        description: error?.message || 'Failed to upload avatar',
        variant: 'destructive',
      })
      setUploading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex gap-6">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarImage src={profile?.avatar_url || user?.user_metadata?.avatar_url} />
                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
              </Avatar>
              <label htmlFor="avatar-upload">
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full cursor-pointer"
                  disabled={uploading}
                  asChild
                >
                  <span>
                    {uploading ? <Upload className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                  </span>
                </Button>
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

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold">
                  {profile?.display_name || user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'User'}
                </h2>
                <Dialog open={isEditing} onOpenChange={setIsEditing}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Profile</DialogTitle>
                      <DialogDescription>
                        Update your display name
                      </DialogDescription>
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
                      <Button variant="outline" onClick={() => setIsEditing(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleUpdateProfile} disabled={loading || !displayName.trim()}>
                        {loading ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {user?.email}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Joined {memberSince}
                </div>
              </div>

              <div className="flex gap-2">
                <Badge variant="secondary" className="gap-1">
                  <Trophy className="h-3 w-3" />
                  Level {profile?.level || 1}
                </Badge>
                <Badge variant="secondary" className="gap-1">
                  <Zap className="h-3 w-3" />
                  {profile?.xp || 0} XP
                </Badge>
                <Badge variant="secondary">
                  🔥 {profile?.streak_count || 0} day streak
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
    </Card>
  )
}
