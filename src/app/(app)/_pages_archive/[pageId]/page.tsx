import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getPageById } from '@/lib/actions/pages'
import { PageEditor } from '@/components/pages/page-editor'

interface PageProps {
    params: Promise<{ pageId: string }>
}

export const dynamic = 'force-dynamic'

export default async function PrivatePage({ params }: PageProps) {
    const { pageId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const result = await getPageById(pageId)

    if (!result.success || !result.page) {
        notFound()
    }

    return (
        <div className="flex-1 h-full flex flex-col animate-in-fade">
            <PageEditor page={result.page as any} />
        </div>
    )
}
