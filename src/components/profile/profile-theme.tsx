import { useTheme } from 'next-themes'
import { Check, Monitor, Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ProfileTheme() {
    const { theme, setTheme } = useTheme()

    const themes = [
        {
            value: 'light',
            label: 'Light',
            icon: Sun,
            description: 'Clean and bright',
            color: 'bg-white border-zinc-200'
        },
        {
            value: 'dark',
            label: 'Dark',
            icon: Moon,
            description: 'Easy on the eyes',
            color: 'bg-zinc-950 border-zinc-800'
        },
        {
            value: 'system',
            label: 'System',
            icon: Monitor,
            description: 'Matches device settings',
            color: 'bg-gradient-to-br from-white to-zinc-950 border-zinc-200 dark:border-zinc-800'
        }
    ]

    return (
        <div className="space-y-6 max-w-4xl">
            <div>
                <h2 className="text-lg font-medium text-[#37352F] dark:text-[#D4D4D4] mb-1">Appearance</h2>
                <p className="text-sm text-[#91918E] dark:text-[#818181]">
                    Customize how Mentra looks on your device.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {themes.map((item) => {
                    const isActive = theme === item.value

                    return (
                        <div key={item.value} onClick={() => setTheme(item.value)} className="cursor-pointer group">
                            <div className={cn(
                                "relative w-full aspect-video rounded-lg border-2 mb-3 overflow-hidden transition-all",
                                isActive
                                    ? "border-[#37352F] dark:border-[#D4D4D4] ring-2 ring-[#37352F]/20 dark:ring-[#D4D4D4]/20"
                                    : "border-transparent ring-1 ring-border group-hover:ring-[#37352F]/40 dark:group-hover:ring-[#D4D4D4]/40"
                            )}>
                                <div className={cn("w-full h-full", item.color, "flex items-center justify-center")}>
                                    <item.icon className={cn(
                                        "w-8 h-8 transition-transform group-hover:scale-110",
                                        item.value === 'light' ? "text-zinc-900" :
                                            item.value === 'dark' ? "text-white" :
                                                "text-zinc-500"
                                    )} />
                                </div>

                                {isActive && (
                                    <div className="absolute top-2 right-2 bg-[#37352F] dark:bg-[#D4D4D4] text-white dark:text-[#37352F] rounded-full p-0.5">
                                        <Check className="w-3 h-3" />
                                    </div>
                                )}
                            </div>

                            <div className="space-y-0.5">
                                <p className={cn(
                                    "text-sm font-medium",
                                    isActive ? "text-[#37352F] dark:text-[#D4D4D4]" : "text-[#37352F]/70 dark:text-[#D4D4D4]/70"
                                )}>
                                    {item.label}
                                </p>
                                {/* <p className="text-xs text-[#91918E] dark:text-[#818181]">
                                    {item.description}
                                </p> */}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
