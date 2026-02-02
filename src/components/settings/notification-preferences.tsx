'use client'

import { useState, useEffect } from 'react'
import { Bell, Mail, Moon, Smartphone } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { getNotificationPreferences, updateNotificationPreferences } from '@/lib/actions/notifications'
import { showSuccessToast, showErrorToast } from '@/lib/error-handler'

export function NotificationPreferences() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [preferences, setPreferences] = useState({
        enablePush: true,
        enableEmail: true,
        quietHoursStart: null as number | null,
        quietHoursEnd: null as number | null,
        emailDigest: false,
        digestFrequency: null as 'daily' | 'weekly' | null,
    })

    useEffect(() => {
        loadPreferences()
    }, [])

    async function loadPreferences() {
        setLoading(true)
        const result = await getNotificationPreferences()
        if (result.success && result.data) {
            setPreferences({
                enablePush: result.data.enablePush,
                enableEmail: result.data.enableEmail,
                quietHoursStart: result.data.quietHoursStart,
                quietHoursEnd: result.data.quietHoursEnd,
                emailDigest: result.data.emailDigest,
                digestFrequency: result.data.digestFrequency as 'daily' | 'weekly' | null,
            })
        }
        setLoading(false)
    }

    async function handleSave() {
        setSaving(true)
        const result = await updateNotificationPreferences(preferences)
        if (result.success) {
            showSuccessToast('Preferences saved', 'Your notification preferences have been updated')
        } else {
            showErrorToast(result.error || 'Failed to save preferences', 'Save preferences')
        }
        setSaving(false)
    }

    const hours = Array.from({ length: 24 }, (_, i) => i)

    if (loading) {
        return <div className="text-sm text-muted-foreground">Loading preferences...</div>
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Notification Channels
                    </CardTitle>
                    <CardDescription>
                        Choose how you want to receive reminders
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="flex items-center gap-2">
                                <Smartphone className="h-4 w-4" />
                                Push Notifications
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Receive notifications in your browser
                            </p>
                        </div>
                        <Switch
                            checked={preferences.enablePush}
                            onCheckedChange={(checked) =>
                                setPreferences({ ...preferences, enablePush: checked })
                            }
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                Email Notifications
                            </Label>
                            <p className="text-sm text-muted-foreground">
                                Receive reminders via email
                            </p>
                        </div>
                        <Switch
                            checked={preferences.enableEmail}
                            onCheckedChange={(checked) =>
                                setPreferences({ ...preferences, enableEmail: checked })
                            }
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Moon className="h-5 w-5" />
                        Quiet Hours
                    </CardTitle>
                    <CardDescription>
                        Pause notifications during specific hours
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Start Time</Label>
                            <Select
                                value={preferences.quietHoursStart?.toString() || 'none'}
                                onValueChange={(value) =>
                                    setPreferences({
                                        ...preferences,
                                        quietHoursStart: value === 'none' ? null : parseInt(value),
                                    })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="No quiet hours" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">No quiet hours</SelectItem>
                                    {hours.map((hour) => (
                                        <SelectItem key={hour} value={hour.toString()}>
                                            {hour.toString().padStart(2, '0')}:00
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>End Time</Label>
                            <Select
                                value={preferences.quietHoursEnd?.toString() || 'none'}
                                onValueChange={(value) =>
                                    setPreferences({
                                        ...preferences,
                                        quietHoursEnd: value === 'none' ? null : parseInt(value),
                                    })
                                }
                                disabled={preferences.quietHoursStart === null}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="No quiet hours" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">No quiet hours</SelectItem>
                                    {hours.map((hour) => (
                                        <SelectItem key={hour} value={hour.toString()}>
                                            {hour.toString().padStart(2, '0')}:00
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Email Digest</CardTitle>
                    <CardDescription>
                        Receive a summary of upcoming tasks instead of individual emails
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label>Enable Digest</Label>
                        <Switch
                            checked={preferences.emailDigest}
                            onCheckedChange={(checked) =>
                                setPreferences({ ...preferences, emailDigest: checked })
                            }
                        />
                    </div>

                    {preferences.emailDigest && (
                        <div className="space-y-2">
                            <Label>Frequency</Label>
                            <Select
                                value={preferences.digestFrequency || 'daily'}
                                onValueChange={(value: 'daily' | 'weekly') =>
                                    setPreferences({ ...preferences, digestFrequency: value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="daily">Daily</SelectItem>
                                    <SelectItem value="weekly">Weekly</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? 'Saving...' : 'Save Preferences'}
            </Button>
        </div>
    )
}
