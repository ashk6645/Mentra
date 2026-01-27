'use server'

import { createClient } from '@/lib/supabase/server'
import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { createClient as createAdminClient } from '@supabase/supabase-js'

/**
 * Permanently delete the current user's account and all associated data
 * This action is irreversible and will:
 * - Delete all tasks, projects, habits, focus sessions, etc. (CASCADE)
 * - Delete the user's profile from the database
 * - Delete the user's auth account from Supabase
 */
export async function deleteUserAccount() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized - No user logged in' }
    }

    try {
        const userId = user.id

        // Step 1: Delete profile from database
        // This will CASCADE delete all related data (tasks, projects, habits, etc.)
        // due to the onDelete: Cascade rules in the Prisma schema
        await prisma.profile.delete({
            where: { id: userId }
        })

        console.log(`✅ Deleted profile and all associated data for user: ${userId}`)

        // Step 2: Delete user from Supabase Auth using admin client
        // This requires the service role key
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (supabaseUrl && supabaseServiceKey) {
            const adminClient = createAdminClient(supabaseUrl, supabaseServiceKey, {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            })

            const { error: authError } = await adminClient.auth.admin.deleteUser(userId)

            if (authError) {
                console.error('⚠️ Error deleting user from auth:', authError.message)
                // Continue anyway - the database data is already deleted
            } else {
                console.log(`✅ Deleted auth user: ${userId}`)
            }
        } else {
            console.log('⚠️ Service role key not configured - user auth account not deleted')
            console.log('   Database data deleted successfully. User profile is gone.')
        }

        // Step 3: Sign out the user
        await supabase.auth.signOut()

        // Step 4: Revalidate
        revalidatePath('/')

        return {
            success: true,
            message: 'Account deleted successfully'
        }
    } catch (error) {
        console.error('Error deleting user account:', error)

        // Provide more specific error message
        if (error instanceof Error) {
            return {
                error: `Failed to delete account: ${error.message}`
            }
        }

        return {
            error: 'Failed to delete account. Please try again or contact support.'
        }
    }
}

/**
 * Reset all user data but keep the account
 * This is irreversible!
 */
export async function resetUserAccount() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'Unauthorized - No user logged in' }
    }

    const userId = user.id

    try {
        // Use a transaction to ensure all or nothing
        await prisma.$transaction(async (tx) => {
            // Delete all user data tables
            // Note: The order matters less with CASCADE but being explicit is safer

            // 1. Core Data
            await tx.task.deleteMany({ where: { userId } })
            await tx.project.deleteMany({ where: { userId } })
            await tx.habit.deleteMany({ where: { userId } })
            await tx.tag.deleteMany({ where: { userId } })
            await tx.areaOfLife.deleteMany({ where: { userId } })

            // 2. Features
            await tx.focusSession.deleteMany({ where: { userId } })
            await tx.page.deleteMany({ where: { userId } })

            // 3. Logs & Gamification
            await tx.xPLog.deleteMany({ where: { userId } })
            await tx.aIActivityLog.deleteMany({ where: { userId } })

            // 4. Shared Data (Where user is the sharer)
            await tx.sharedProject.deleteMany({ where: { sharedByUserId: userId } })

            // 5. Reset Profile Stats
            await tx.profile.update({
                where: { id: userId },
                data: {
                    level: 1,
                    totalXp: 0,
                    currentStreak: 0,
                    longestStreak: 0,
                    // Keep personal info
                }
            })
        })

        console.log(`✅ Reset account data for user: ${userId}`)

        revalidatePath('/')
        return { success: true, message: 'Account reset successfully' }

    } catch (error) {
        console.error('Error resetting account:', error)
        if (error instanceof Error) {
            return {
                error: `Failed to reset account: ${error.message}`
            }
        }
        return { error: 'Failed to reset account' }
    }
}
