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
