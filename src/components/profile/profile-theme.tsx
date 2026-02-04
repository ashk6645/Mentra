import { useTheme } from 'next-themes'
import { Card } from '@/components/ui/card'
import { Check, Monitor, Moon, Sun, Smartphone, Flower2, SunMoon, CloudMoon, Snowflake, Trees, Scroll, Zap, Waves, Sunrise, Sparkles, Leaf, Square } from 'lucide-react'
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
            value: 'amoled',
            label: 'AMOLED',
            icon: Smartphone,
            description: 'True black for OLED',
            color: 'bg-black border-zinc-800'
        },
        {
            value: 'midnight',
            label: 'Midnight',
            icon: CloudMoon,
            description: 'Deep blue night',
            color: 'bg-[#0B1220] border-[#1F2937]'
        },
        {
            value: 'nord',
            label: 'Nord',
            icon: Snowflake,
            description: 'Arctic freshness',
            color: 'bg-[#ECEFF4] border-[#D8DEE9]'
        },
        {
            value: 'forest',
            label: 'Forest',
            icon: Trees,
            description: 'Natural greens',
            color: 'bg-[#0F1F17] border-[#1E4034]'
        },
        {
            value: 'paper',
            label: 'Paper',
            icon: Scroll,
            description: 'Warm and readable',
            color: 'bg-[#FAFAF7] border-[#E5E7EB]'
        },
        {
            value: 'cyberpunk',
            label: 'Cyberpunk',
            icon: Zap,
            description: 'Neon future',
            color: 'bg-[#050014] border-[#2E1065]'
        },
        {
            value: 'solarized',
            label: 'Solarized',
            icon: SunMoon,
            description: 'Warm and high contrast',
            color: 'bg-[#FDF6E3] border-[#EEE8D5]'
        },
        {
            value: 'rose',
            label: 'Rose',
            icon: Flower2,
            description: 'Soft pink aesthetic',
            color: 'bg-[#FFF1F2] border-[#FECDD3]'
        },
        {
            value: 'ocean',
            label: 'Ocean',
            icon: Waves,
            description: 'Deep blue waters',
            color: 'bg-gradient-to-br from-[#0A1929] to-[#0D2238] border-[#1E3A5F]'
        },
        {
            value: 'sunset',
            label: 'Sunset',
            icon: Sunrise,
            description: 'Warm orange glow',
            color: 'bg-gradient-to-br from-[#FFF8F0] to-[#FFEDD5] border-[#FDBA74]'
        },
        {
            value: 'lavender',
            label: 'Lavender',
            icon: Sparkles,
            description: 'Soft purple dream',
            color: 'bg-gradient-to-br from-[#FAF5FF] to-[#F3E8FF] border-[#D8B4FE]'
        },
        {
            value: 'mint',
            label: 'Mint',
            icon: Leaf,
            description: 'Fresh and cool',
            color: 'bg-gradient-to-br from-[#F0FDF9] to-[#CCFBF1] border-[#5EEAD4]'
        },
        {
            value: 'charcoal',
            label: 'Charcoal',
            icon: Square,
            description: 'Sophisticated gray',
            color: 'bg-[#18181B] border-[#3F3F46]'
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
                    Customize how Mentra looks on your device. Choose from {themes.length} beautiful themes.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                                                item.value === 'amoled' ? "text-white" :
                                                    item.value === 'midnight' ? "text-[#3B82F6]" :
                                                        item.value === 'nord' ? "text-[#5E81AC]" :
                                                            item.value === 'forest' ? "text-[#22C55E]" :
                                                                item.value === 'paper' ? "text-[#1F2937]" :
                                                                    item.value === 'cyberpunk' ? "text-[#7C3AED]" :
                                                                        item.value === 'solarized' ? "text-[#268BD2]" :
                                                                            item.value === 'rose' ? "text-[#E11D48]" :
                                                                                item.value === 'ocean' ? "text-[#0EA5E9]" :
                                                                                    item.value === 'sunset' ? "text-[#F97316]" :
                                                                                        item.value === 'lavender' ? "text-[#A855F7]" :
                                                                                            item.value === 'mint' ? "text-[#14B8A6]" :
                                                                                                item.value === 'charcoal' ? "text-[#71717A]" :
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
