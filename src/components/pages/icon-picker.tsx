'use client'

import React, { useState } from 'react'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

interface IconPickerProps {
    children: React.ReactNode
    onIconSelect: (icon: string) => void
    currentIcon?: string | null
}

const EMOJI_CATEGORIES = {
    Business: [
  '📊', '📈', '📉',
  '💼',
  '🏢',
  '🧾',
  '💰', '💳',
  '📑',
  '🧮',
  '📅',
  '📆',
  '📍',
  '🧠',
  '🎯',
  '📌'
],
    Common: ['📄', '📝', '📋', '📊', '🎯', '💡', '🚀', '⭐', '📌', '🔖', '📚', '🎨', '✅', '🔥', '⚠️'],
    Faces: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸', '🤩', '🥳', '😏', '😒', '😞', '😔', 'wv', '😕', '😟', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃'],
    Objects: ['💻', '🖥️', '🖨️', '🖱️', '⌨️', '📱', '📲', '⌚', '📷', '📹', '🔒', '🔓', '🔑', '🔨', '🛠️', '🧱', '⚙️', '🔗', '📎', '📏', '📐', '✂️', '🖊️', '🖋️', '🖌️', '🖍️', '📦', '🎁', '📅', '📆', '🗓️', '📇', '📈', '📉', '📊', '📋', '📌', '📍', '️', '📣', '📢', '🔔', '🔕', '🔍', '🔎', '🕯️', '💡', '🔦', '📕', '📖', '📗', '📘', '📙', '📚', '📓', '📒', '📃', '📜', '📄', '📰', '🗞️', '📑', '🔖', '💰', '💴', '💵', '💶', '💷', '💸', '💳', '🧾', '📧', '📨', '📩', '📤', '📥'],
    Nature: ['☀️', '🌤️', '⛅', '🌥️', '☁️', '🌦️', '🌧️', '⛈️', '🌩️', '🌨️', '❄️', '☃️', '⛄', '🌬️', '💨', '🌪️', '🌫️', '🌈', '☂️', '☔', '⚡', '💧', '🌊', '🌍', '🌎', '🌏', '🪐', '🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘', '🌙', '🌚', '🌛', '🌜', '🔥', '🌲', '🌳', '🌴', '🌵', '🌷', '🌸', '🌹', '🌺', '🌻', '🌼', '🌽', '🌾', '🌿', '☘️', '🍀', '🍁', '🍂', '🍃', '🍄', '🌰', '🦀', '🦞', '🦐', '🦑', '🐙', '🐠', '🐟', '🐡', '🐬', '🦈', '🐳', '🐋', '🐊', '🐆', '🐅', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🐐', '🐪', '🐫', '🦙', '🦒', '🐘', '🦏', '🦛', '🐁', '🐀', '🐇', '🐕', '🐩', '🐈', '🐓', '🦃', '🦚', '🦜', '🦢', '🕊️', '🦝', '🦡', '🐾'],
    Symbols: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️', '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐', '⛎', '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '🆔', '⚛️', '🉑', '☢️', '☣️', '📴', '📳', '🈶', '🈚', '🈸', '🈺', '🈷️', '✴️', '🆚', '💮', '🉐', '㊙️', '㊗️', '🈴', '🈵', '🈹', '🈲', '🅰️', '🅱️', '🆎', '🆑', '🅾️', '🆘', '❌', '⭕', '🛑', '⛔', '📛', '🚫', '💯', '💢', '♨️', '🚷', '🚯', '🚳', '🚱', '🔞', '📵', '🚭', '❗', '❕', '❓', '❔', '‼️', '⁉️', '🔅', '🔆', '〽️', '⚠️', '🚸', '🔱', '⚜️', '🔰', '♻️', '✅', '🈯', '💹', '❇️', '✳️', '❎', '🌐', '💠', 'Ⓜ️', '🌀', '💤', '🏧', '🚾', '♿', '🅿️', '🈳', '🈂️', '🛂', '🛃', '🛄', '🛅', '🚹', '🚺', '🚼', '🚻', '🚮', '🎦', '📶', '🈁', '🆖', '🆗', '🆙', '🆒', '🆕', '🆓', '0️⃣', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟', '🔢', '#️⃣', '*️⃣', '▶️', '⏸️', '⏯️', '⏹️', '⏺️', '⏭️', '⏮️', '⏩', '⏪', '⏫', '⏬', '◀️', '🔼', '🔽', '➡️', '⬅️', '⬆️', '⬇️', '↗️', '↘️', '↙️', '↖️', '↕️', '↔️', '↪️', '↩️', '⤴️', '⤵️', '🔀', '🔁', '🔂', '🔄', '🔃', '🎵', '🎶', '➕', '➖', '➗', '✖️', '💲', '💱', '™️', '©️', '®️', '〰️', '➰', '➿', '🔚', '🔙', '🔛', '🔝', '🔜', '✔️', '☑️', '🔘', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚫', '⚪', '🟤', '🔺', '🔻', '🔸', '🔹', '🔶', '🔷', '🔳', '🔲', '▪️', '▫️', '◾', '◽', '◼️', '◻️', '🟥', '🟧', '🟨', '🟩', '🟦', '🟪', '⬛', '⬜', '🟫'],
}

export function IconPicker({ children, onIconSelect, currentIcon }: IconPickerProps) {
    const [open, setOpen] = useState(false)

    const handleSelect = (icon: string) => {
        onIconSelect(icon)
        setOpen(false)
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                {children}
            </PopoverTrigger>
            <PopoverContent className="w-[340px] p-0" align="start">
                <Tabs defaultValue="emojis" className="w-full">
                    <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
                        <TabsTrigger
                            value="emojis"
                            className="flex-1 rounded-none border-b-2 border-transparent py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent"
                        >
                            Emojis
                        </TabsTrigger>
                        <TabsTrigger
                            value="custom"
                            className="flex-1 rounded-none border-b-2 border-transparent py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent"
                        >
                            Custom
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="emojis" className="mt-0">
                        <Tabs defaultValue="Common" className="w-full">
                            <div className="flex items-center px-4 py-2 border-b">
                                <TabsList className="h-8 bg-transparent p-0 gap-1">
                                    {Object.keys(EMOJI_CATEGORIES).map((category) => (
                                        <TabsTrigger
                                            key={category}
                                            value={category}
                                            className="h-7 px-2 text-xs data-[state=active]:bg-muted"
                                        >
                                            {category}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                            </div>
                            {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
                                <TabsContent key={category} value={category} className="mt-0">
                                    <ScrollArea className="h-[300px] w-full p-2">
                                        <div className="grid grid-cols-7 gap-1">
                                            {emojis.map((emoji) => (
                                                <button
                                                    key={emoji}
                                                    onClick={() => handleSelect(emoji)}
                                                    className={cn(
                                                        "flex items-center justify-center w-9 h-9 text-xl rounded-md hover:bg-muted transition-colors",
                                                        currentIcon === emoji && "bg-muted ring-2 ring-primary/20"
                                                    )}
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                </TabsContent>
                            ))}
                        </Tabs>
                    </TabsContent>

                    <TabsContent value="custom" className="p-4">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Image URL</label>
                                <div className="flex gap-2">
                                    <CustomIconInput onSelect={handleSelect} />
                                </div>
                            </div>
                            <div className="text-xs text-muted-foreground">
                                Paste a direct link to an image (PNG, JPG, SVG, GIF) to use as step icon.
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </PopoverContent>
        </Popover>
    )
}

function CustomIconInput({ onSelect }: { onSelect: (url: string) => void }) {
    const [url, setUrl] = useState('')

    return (
        <div className="flex w-full gap-2">
            <input
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="https://example.com/icon.png"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && url) {
                        onSelect(url)
                    }
                }}
            />
            <Button size="sm" onClick={() => url && onSelect(url)}>
                Use
            </Button>
        </div>
    )
}
