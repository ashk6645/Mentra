'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Volume2, VolumeX, CloudRain, Coffee, Music, ChevronUp } from 'lucide-react'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Production-grade sound assets (using reliable CDN proxies or placeholders)
const SOUNDS = [
    {
        id: 'rain',
        name: 'Rain',
        icon: CloudRain,
        src: 'https://cdn.pixabay.com/download/audio/2022/07/04/audio_924df0869e.mp3?filename=soft-rain-ambient-111154.mp3'
    },
    {
        id: 'cafe',
        name: 'Café',
        icon: Coffee,
        src: 'https://cdn.pixabay.com/download/audio/2022/05/23/audio_3316533031.mp3?filename=coffee-shop-chatter-15797.mp3'
    },
    {
        id: 'lofi',
        name: 'Lo-Fi',
        icon: Music,
        src: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3'
    }
]

export function AmbientSoundController() {
    const [isPlaying, setIsPlaying] = useState(false)
    const [volume, setVolume] = useState(0.5)
    const [currentSoundId, setCurrentSoundId] = useState<string | null>(null)
    const [isHovered, setIsHovered] = useState(false)
    const audioRef = useRef<HTMLAudioElement | null>(null)

    // Initialize audio
    useEffect(() => {
        audioRef.current = new Audio()
        audioRef.current.loop = true

        return () => {
            if (audioRef.current) {
                audioRef.current.pause()
                audioRef.current = null
            }
        }
    }, [])

    // Handle Play/Pause & Track Change
    useEffect(() => {
        if (!audioRef.current) return

        if (currentSoundId) {
            const sound = SOUNDS.find(s => s.id === currentSoundId)
            if (sound && audioRef.current.src !== sound.src) {
                audioRef.current.src = sound.src
                audioRef.current.load()
            }

            if (isPlaying) {
                audioRef.current.play().catch(e => console.error("Audio play failed", e))
            } else {
                audioRef.current.pause()
            }
        } else {
            audioRef.current.pause()
        }
    }, [currentSoundId, isPlaying])

    // Handle Volume
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume
        }
    }, [volume])

    // Keyboard shortcut 'M' to mute/unmute
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key.toLowerCase() === 'm') {
                setIsPlaying(prev => !prev)
                if (!currentSoundId) setCurrentSoundId('rain')
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [currentSoundId])

    return (
        <div
            className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-2"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="bg-black/60 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl mb-2 w-64"
                    >
                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-xs text-white/50 uppercase tracking-wider font-medium">
                                <span>Ambience</span>
                                <span>{Math.round(volume * 100)}%</span>
                            </div>

                            {/* Sound Selection */}
                            <div className="flex gap-2">
                                {SOUNDS.map((sound) => {
                                    const Icon = sound.icon
                                    const isActive = currentSoundId === sound.id

                                    return (
                                        <button
                                            key={sound.id}
                                            onClick={() => {
                                                if (isActive) {
                                                    setIsPlaying(!isPlaying)
                                                } else {
                                                    setCurrentSoundId(sound.id)
                                                    setIsPlaying(true)
                                                }
                                            }}
                                            className={cn(
                                                "flex-1 flex flex-col items-center gap-2 p-3 rounded-xl transition-all duration-200",
                                                isActive && isPlaying
                                                    ? "bg-white/20 text-white"
                                                    : "bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/80"
                                            )}
                                        >
                                            <Icon className="h-5 w-5" />
                                            <span className="text-[10px] font-medium">{sound.name}</span>
                                        </button>
                                    )
                                })}
                            </div>

                            {/* Volume Slider */}
                            <div className="flex items-center gap-3 pt-2">
                                <VolumeX className="h-4 w-4 text-white/30" />
                                <Slider
                                    value={[volume]}
                                    max={1}
                                    step={0.01}
                                    onValueChange={([val]) => setVolume(val)}
                                    className="flex-1"
                                />
                                <Volume2 className="h-4 w-4 text-white/80" />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <Button
                variant="ghost"
                size="icon"
                className={cn(
                    "h-12 w-12 rounded-full border backdrop-blur-md transition-all duration-300 shadow-lg",
                    isPlaying
                        ? "bg-white text-black border-white hover:bg-white/90"
                        : "bg-white/5 text-white/50 border-white/10 hover:bg-white/10 hover:text-white"
                )}
                onClick={() => {
                    setIsPlaying(!isPlaying)
                    if (!currentSoundId) setCurrentSoundId('rain') // Default start
                }}
            >
                {isPlaying ? (
                    <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                    >
                        <Volume2 className="h-5 w-5" />
                    </motion.div>
                ) : (
                    <VolumeX className="h-5 w-5" />
                )}
            </Button>
        </div>
    )
}
