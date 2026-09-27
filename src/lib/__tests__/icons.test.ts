import { isLucideIcon, lucideName, toLucideIcon } from '../icons'

describe('stored icon values', () => {
    it('round-trips a Lucide icon name', () => {
        expect(toLucideIcon('arrow-down-0-1')).toBe('lucide:arrow-down-0-1')
        expect(lucideName('lucide:arrow-down-0-1')).toBe('arrow-down-0-1')
    })

    it('treats anything else as an emoji', () => {
        expect(lucideName('🚀')).toBeNull()
        expect(lucideName(null)).toBeNull()
        expect(lucideName(undefined)).toBeNull()
    })

    it('accepts only well-formed Lucide values', () => {
        expect(isLucideIcon('lucide:rocket')).toBe(true)
        expect(isLucideIcon('lucide:grid-2x2')).toBe(true)
        expect(isLucideIcon('lucide:')).toBe(false)
        expect(isLucideIcon('lucide:Rocket')).toBe(false)
        expect(isLucideIcon('lucide:rocket-')).toBe(false)
        expect(isLucideIcon('lucide:<svg>')).toBe(false)
        expect(isLucideIcon('rocket')).toBe(false)
        expect(isLucideIcon(`lucide:${'a'.repeat(60)}`)).toBe(false)
    })
})
