import { redirect } from 'next/navigation'

export default function PrivateRootPage() {
    redirect('/dashboard')
}
