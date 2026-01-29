'use client'

import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, Share2, Trash2, UserPlus } from 'lucide-react'
import { sharePage, unsharePage, getPageCollaborators, updatePageCollaboratorPermission } from '@/lib/actions/page-sharing'
import { useToast } from '@/components/ui/use-toast'
import { Badge } from '@/components/ui/badge'

interface SharePageDialogProps {
    pageId: string
    pageTitle: string
    isOwner: boolean
}

interface Collaborator {
    userId: string
    email: string
    displayName: string | null
    avatarUrl: string | null
    permission: string
}

export function SharePageDialog({ pageId, pageTitle, isOwner }: SharePageDialogProps) {
    const [open, setOpen] = useState(false)
    const [email, setEmail] = useState('')
    const [permission, setPermission] = useState('view')
    const [loading, setLoading] = useState(false)
    const [collaborators, setCollaborators] = useState<Collaborator[]>([])
    const [fetching, setFetching] = useState(false)
    const { toast } = useToast()

    useEffect(() => {
        if (open) {
            fetchCollaborators()
        }
    }, [open])

    const fetchCollaborators = async () => {
        setFetching(true)
        const data = await getPageCollaborators(pageId)
        setCollaborators(data)
        setFetching(false)
    }

    const handleShare = async () => {
        if (!email) return

        setLoading(true)
        try {
            const result = await sharePage({
                pageId,
                email,
                permission: permission as 'view' | 'edit' | 'admin'
            })

            if (result.success) {
                toast({
                    title: 'Invitation Sent',
                    description: `Page shared with ${email}`,
                })
                setEmail('')
                fetchCollaborators()
            } else {
                toast({
                    title: 'Error',
                    description: result.error || 'Failed to share page',
                    variant: 'destructive',
                })
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Something went wrong',
                variant: 'destructive',
            })
        } finally {
            setLoading(false)
        }
    }

    const handleRemove = async (userId: string) => {
        if (!confirm('Are you sure you want to remove this user?')) return

        try {
            const result = await unsharePage(pageId, userId)
            if (result.success) {
                setCollaborators(prev => prev.filter(c => c.userId !== userId))
                toast({
                    title: 'Removed',
                    description: 'Collaborator removed from page',
                })
            } else {
                toast({
                    title: 'Error',
                    description: result.error,
                    variant: 'destructive',
                })
            }
        } catch (error) {
            console.error(error)
        }
    }

    const handlePermissionChange = async (userId: string, newPerm: string) => {
        // Optimistic update
        setCollaborators(prev => prev.map(c => c.userId === userId ? { ...c, permission: newPerm } : c))

        const result = await updatePageCollaboratorPermission(pageId, userId, newPerm as any)
        if (!result.success) {
            // Revert on failure
            fetchCollaborators()
            toast({ title: 'Error', description: result.error, variant: 'destructive' })
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 h-8 text-muted-foreground hover:text-foreground">
                    <Share2 className="h-4 w-4" />
                    Share
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Share "{pageTitle}"</DialogTitle>
                    <DialogDescription>
                        Invite people to collaborate on this page.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Invite Form */}
                    <div className="flex gap-2 items-end">
                        <div className="grid gap-1.5 flex-1">
                            <Input
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={!isOwner}
                            />
                        </div>
                        <Select value={permission} onValueChange={setPermission} disabled={!isOwner}>
                            <SelectTrigger className="w-[100px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="view">View</SelectItem>
                                <SelectItem value="edit">Edit</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button onClick={handleShare} disabled={loading || !email || !isOwner}>
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                        </Button>
                    </div>

                    {/* Collaborators List */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-medium text-muted-foreground">Collaborators</h4>

                        {fetching ? (
                            <div className="flex justify-center py-4 text-muted-foreground">
                                <Loader2 className="h-5 w-5 animate-spin" />
                            </div>
                        ) : collaborators.length === 0 ? (
                            <div className="text-center py-4 text-sm text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
                                No collaborators yet.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {collaborators.map((user) => (
                                    <div key={user.userId} className="flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={user.avatarUrl || ''} />
                                                <AvatarFallback>{(user.displayName || 'U')[0].toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium truncate">{user.displayName || 'User'}</p>
                                                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {isOwner ? (
                                                <Select
                                                    value={user.permission}
                                                    onValueChange={(val) => handlePermissionChange(user.userId, val)}
                                                >
                                                    <SelectTrigger className="h-8 w-[90px] text-xs">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="view">View</SelectItem>
                                                        <SelectItem value="edit">Edit</SelectItem>
                                                        <SelectItem value="admin">Admin</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <Badge variant="secondary" className="capitalize">{user.permission}</Badge>
                                            )}

                                            {isOwner && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() => handleRemove(user.userId)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
