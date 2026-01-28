import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { ProfileView } from './profile-view'

interface ProfileDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ProfileDialog({ open, onOpenChange }: ProfileDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-full max-w-6xl sm:max-w-6xl h-[85vh] p-0 overflow-hidden flex flex-col gap-0 border-border/50 bg-background/95 backdrop-blur-xl">
                <DialogHeader>
                    <VisuallyHidden>
                        <DialogTitle>Profile</DialogTitle>
                    </VisuallyHidden>
                </DialogHeader>
                <ProfileView />
            </DialogContent>
        </Dialog>
    )
}
