import { parseTaskNaturalLanguage } from '../task-parser'

/**
 * The natural-language task parser, which every quick-add in the app uses.
 *
 * jest.setup pins TZ to UTC; `now` is a fixed Sunday so weekday words resolve
 * the same way on every run.
 */

const NOW = new Date('2026-09-27T10:00:00.000Z') // Sunday
const parse = (input: string) => parseTaskNaturalLanguage(input, { currentDate: NOW, availableTags: [] })

describe('dates next to other tokens', () => {
    // Regression: the date was dropped whenever a priority or label followed a
    // time written without "at", because the lengthened preprocessed match was
    // measured against the original text and appeared to overlap the next token.
    it('keeps "friday 10am" when a priority follows', () => {
        const result = parse('Ship the beta friday 10am p2')
        expect(result.title).toBe('Ship the beta')
        expect(result.priority).toBe('high')
        expect(result.dueDate?.toISOString()).toBe('2026-10-02T10:00:00.000Z')
    })

    it('keeps "tomorrow 3pm" alongside a priority, a label and a repeat', () => {
        const result = parse('Call Sam tomorrow 3pm p1 @work every monday')
        expect(result.title).toBe('Call Sam')
        expect(result.priority).toBe('urgent')
        expect(result.tagNames).toEqual(['work'])
        expect(result.recurrence).toEqual({ interval: 'weekly', step: 1, days: [1] })
        expect(result.dueDate?.toISOString()).toBe('2026-09-28T15:00:00.000Z')
    })

    it('still reads dates written with "at"', () => {
        expect(parse('Ship the beta friday at 10am').dueDate?.toISOString()).toBe('2026-10-02T10:00:00.000Z')
    })
})

describe('titles and tokens', () => {
    it('leaves a plain title alone', () => {
        const result = parse('Buy milk')
        expect(result).toMatchObject({ title: 'Buy milk', tagNames: [] })
        expect(result.dueDate).toBeUndefined()
        expect(result.priority).toBeUndefined()
    })

    it('maps p1–p4 onto the four priorities', () => {
        expect(parse('a p1').priority).toBe('urgent')
        expect(parse('a p2').priority).toBe('high')
        expect(parse('a p3').priority).toBe('medium')
        expect(parse('a p4').priority).toBe('low')
    })

    it('drops a trailing connector left behind by a removed date', () => {
        expect(parse('Finish the report by tomorrow').title).toBe('Finish the report')
    })
})
