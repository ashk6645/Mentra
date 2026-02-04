'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function BackgroundPattern() {
    const { theme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    // Theme-specific pattern configurations
    const getPatternConfig = () => {
        switch (theme) {
            case 'light':
            case 'paper':
                return { pattern: 'botanical-leaves', color: '#000000' }
            case 'dark':
            case 'amoled':
            case 'charcoal':
                return { pattern: 'geometric-dots', color: '#FFFFFF' }
            case 'midnight':
                return { pattern: 'geometric-hexagons', color: '#3B82F6' }
            case 'nord':
                return { pattern: 'botanical-flowers', color: '#5E81AC' }
            case 'forest':
                return { pattern: 'botanical-leaves', color: '#22C55E' }
            case 'solarized':
                return { pattern: 'geometric-dots', color: '#2AA198' }
            case 'rose':
                return { pattern: 'botanical-flowers', color: '#E11D48' }
            case 'cyberpunk':
                return { pattern: 'geometric-hexagons', color: '#7C3AED' }
            case 'ocean':
                return { pattern: 'nature-waves', color: '#0EA5E9' }
            case 'sunset':
                return { pattern: 'nature-clouds', color: '#F97316' }
            case 'lavender':
                return { pattern: 'botanical-flowers', color: '#A855F7' }
            case 'mint':
                return { pattern: 'botanical-leaves', color: '#14B8A6' }
            default:
                return { pattern: 'geometric-dots', color: '#000000' }
        }
    }

    const { pattern, color } = getPatternConfig()

    return (
        <div className="bg-pattern" aria-hidden="true">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    {/* Botanical Leaves Pattern */}
                    <pattern id="botanical-leaves" x="0" y="0" width="120" height="120" patternUnits="userSpaceOnUse">
                        <path d="M20,30 Q25,20 30,30 T40,30" fill="none" stroke={color} strokeWidth="0.5" />
                        <path d="M25,35 Q30,25 35,35" fill="none" stroke={color} strokeWidth="0.5" />
                        <ellipse cx="28" cy="32" rx="3" ry="6" fill={color} opacity="0.1" />

                        <path d="M80,70 Q85,60 90,70 T100,70" fill="none" stroke={color} strokeWidth="0.5" />
                        <path d="M85,75 Q90,65 95,75" fill="none" stroke={color} strokeWidth="0.5" />
                        <ellipse cx="88" cy="72" rx="3" ry="6" fill={color} opacity="0.1" />
                    </pattern>

                    {/* Botanical Flowers Pattern */}
                    <pattern id="botanical-flowers" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                        <circle cx="25" cy="25" r="2" fill={color} opacity="0.15" />
                        <circle cx="30" cy="20" r="1.5" fill={color} opacity="0.1" />
                        <circle cx="20" cy="20" r="1.5" fill={color} opacity="0.1" />
                        <circle cx="30" cy="30" r="1.5" fill={color} opacity="0.1" />
                        <circle cx="20" cy="30" r="1.5" fill={color} opacity="0.1" />

                        <circle cx="75" cy="75" r="2" fill={color} opacity="0.15" />
                        <circle cx="80" cy="70" r="1.5" fill={color} opacity="0.1" />
                        <circle cx="70" cy="70" r="1.5" fill={color} opacity="0.1" />
                        <circle cx="80" cy="80" r="1.5" fill={color} opacity="0.1" />
                        <circle cx="70" cy="80" r="1.5" fill={color} opacity="0.1" />
                    </pattern>

                    {/* Geometric Dots Pattern */}
                    <pattern id="geometric-dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                        <circle cx="10" cy="10" r="1" fill={color} opacity="0.2" />
                        <circle cx="30" cy="30" r="1" fill={color} opacity="0.2" />
                        <circle cx="20" cy="20" r="0.5" fill={color} opacity="0.15" />
                    </pattern>

                    {/* Geometric Hexagons Pattern */}
                    <pattern id="geometric-hexagons" x="0" y="0" width="100" height="87" patternUnits="userSpaceOnUse">
                        <path d="M50,0 L93.3,25 L93.3,62 L50,87 L6.7,62 L6.7,25 Z"
                            fill="none"
                            stroke={color}
                            strokeWidth="0.5"
                            opacity="0.15" />
                    </pattern>

                    {/* Nature Waves Pattern */}
                    <pattern id="nature-waves" x="0" y="0" width="200" height="100" patternUnits="userSpaceOnUse">
                        <path d="M0,50 Q50,30 100,50 T200,50"
                            fill="none"
                            stroke={color}
                            strokeWidth="0.5"
                            opacity="0.15" />
                        <path d="M0,60 Q50,40 100,60 T200,60"
                            fill="none"
                            stroke={color}
                            strokeWidth="0.5"
                            opacity="0.1" />
                    </pattern>

                    {/* Nature Clouds Pattern */}
                    <pattern id="nature-clouds" x="0" y="0" width="150" height="100" patternUnits="userSpaceOnUse">
                        <ellipse cx="40" cy="30" rx="20" ry="10" fill={color} opacity="0.08" />
                        <ellipse cx="50" cy="28" rx="15" ry="8" fill={color} opacity="0.08" />
                        <ellipse cx="30" cy="32" rx="12" ry="7" fill={color} opacity="0.08" />

                        <ellipse cx="110" cy="70" rx="18" ry="9" fill={color} opacity="0.08" />
                        <ellipse cx="120" cy="68" rx="14" ry="7" fill={color} opacity="0.08" />
                        <ellipse cx="100" cy="72" rx="11" ry="6" fill={color} opacity="0.08" />
                    </pattern>
                </defs>

                <rect width="100%" height="100%" fill={`url(#${pattern})`} />
            </svg>
        </div>
    )
}
