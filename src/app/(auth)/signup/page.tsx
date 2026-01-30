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

export default function SignupPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const router = useRouter()
    const supabase = createClient()

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: `${location.origin}/api/auth/callback`,
            },
        })

        if (error) {
            setError(error.message)
            setLoading(false)
        } else {
            // Redirect or show success message
            router.push('/dashboard?verified=false')
            router.refresh()
        }
    }

    return (
        <AuthLayout
            title="Create an account"
            subtitle="Enter your email to get started"
            footerLabel="Already have an account?"
            footerLinkText="Sign in"
            footerLinkHref="/login"
        >
            <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-4">
                    <GoogleAuthButton />
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-card px-2 text-muted-foreground">
                                Or continue with
                            </span>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="m@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="bg-background/50 border-input focus:ring-primary/20 transition-all duration-300"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="bg-background/50 border-input focus:ring-primary/20 transition-all duration-300"
                    />
                </div>
                {error && (
                    <div className="text-sm text-destructive font-medium bg-destructive/10 p-3 rounded-lg border border-destructive/20">
                        {error}
                    </div>
                )}
                <Button
                    type="submit"
                    className="w-full h-11 font-medium text-base shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300"
                    disabled={loading}
                >
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Sign Up
                </Button>
            </form>
        </AuthLayout>
    )
}

