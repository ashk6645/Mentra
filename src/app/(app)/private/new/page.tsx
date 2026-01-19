import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createPage } from '@/lib/actions/pages'

export const dynamic = 'force-dynamic'

export default async function NewPrivatePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Create a new page and redirect to it
    const result = await createPage({ title: 'Untitled' })

    if (result.success && result.page) {
        redirect(`/private/${result.page.id}`)
    }

    // Fallback to dashboard if page creation fails
    redirect('/dashboard')
}
