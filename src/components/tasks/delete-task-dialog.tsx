'use client'

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
import { useState } from 'react'
import { Loader2 } from 'lucide-react'

interface DeleteTaskDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onConfirm: () => Promise<void>
    taskTitle: string
}

export function DeleteTaskDialog({
    open,
    onOpenChange,
    onConfirm,
    taskTitle,
}: DeleteTaskDialogProps) {
    const [isDeleting, setIsDeleting] = useState(false)

    const handleConfirm = async (e: React.MouseEvent) => {
        e.preventDefault()
        setIsDeleting(true)
        try {
            await onConfirm()
            onOpenChange(false)
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-center">Delete Task?</AlertDialogTitle>
                    <AlertDialogDescription className="text-center">
                        The <span className="font-medium text-foreground">"{taskTitle}"</span> will be permanently deleted.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="sm:justify-center gap-2">
                    <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={handleConfirm}
                        disabled={isDeleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                        {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
}
