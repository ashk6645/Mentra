// XP Constants
export const XP_TASK_COMPLETE = 10
export const XP_SUBTASK_COMPLETE = 5
export const XP_STREAK_BONUS = 25
export const XP_LEVEL_BASE = 100  // XP needed for level 1
export const XP_LEVEL_MULTIPLIER = 1.5  // Each level requires more XP

export function calculateLevel(totalXp: number): number {
    let level = 1
    let xpNeeded = XP_LEVEL_BASE
    let remainingXp = totalXp

    while (remainingXp >= xpNeeded) {
        remainingXp -= xpNeeded
        level++
        xpNeeded = Math.floor(XP_LEVEL_BASE * Math.pow(XP_LEVEL_MULTIPLIER, level - 1))
    }

    return level
}

export function xpForNextLevel(currentLevel: number): number {
    return Math.floor(XP_LEVEL_BASE * Math.pow(XP_LEVEL_MULTIPLIER, currentLevel - 1))
}

export function xpProgressInCurrentLevel(totalXp: number): { current: number; needed: number; percentage: number } {
    let level = 1
    let xpNeeded = XP_LEVEL_BASE
    let remainingXp = totalXp

    while (remainingXp >= xpNeeded) {
        remainingXp -= xpNeeded
        level++
        xpNeeded = Math.floor(XP_LEVEL_BASE * Math.pow(XP_LEVEL_MULTIPLIER, level - 1))
    }

    return {
        current: remainingXp,
        needed: xpNeeded,
        percentage: Math.round((remainingXp / xpNeeded) * 100)
    }
}
