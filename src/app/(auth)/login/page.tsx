'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { GoogleAuthButton } from '@/components/auth/google-auth-button'
import { AuthLayout } from '@/components/auth/auth-layout'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const router = useRouter()
    const supabase = createClient()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            setError(error.message)
            setLoading(false)
        } else {
            router.push('/today')
            router.refresh()
        }
    }

    return (
        <AuthLayout
            title="Welcome back"
            subtitle="Enter your email to access your account"
            footerLabel="Don't have an account?"
            footerLinkText="Sign up"
            footerLinkHref="/signup"
        >
            <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-4">
                    <GoogleAuthButton />
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-slate-200" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-white/50 px-2 text-slate-500">
                                Or continue with
                            </span>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-700">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="m@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="bg-white/50 border-slate-200 focus:ring-blue-500/20 text-slate-900 placeholder:text-slate-400 transition-all duration-300"
                    />
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="text-slate-700">Password</Label>
                        <Link
                            href="/forgot-password"
                            className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                        >
                            Forgot password?
                        </Link>
                    </div>
                    <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="bg-white/50 border-slate-200 focus:ring-blue-500/20 text-slate-900 transition-all duration-300"
                    />
                </div>
                {error && (
                    <div className="text-sm text-red-600 font-medium bg-red-50 p-3 rounded-lg border border-red-200">
                        {error}
                    </div>
                )}
                <Button
                    type="submit"
                    className="w-full h-11 font-medium text-base shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 transition-all duration-300 bg-slate-900 hover:bg-slate-800 text-white"
                    disabled={loading}
                >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign In
                </Button>
            </form>
        </AuthLayout>
    )
}

