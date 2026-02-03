
import { parseTaskNaturalLanguage } from './src/lib/parsers/task-parser';

// Mock context
const context = { currentDate: new Date() };

function test(input: string) {
    console.log(`\nInput: "${input}"`);
    try {
        const result = parseTaskNaturalLanguage(input, context);
        console.log(`Title: "${result.title}"`);
        console.log(`Date: ${result.dueDate ? result.dueDate.toString() : 'None'}`);
        console.log(`Recurrence: ${result.recurrence ? JSON.stringify(result.recurrence) : 'None'}`);
    } catch (e) {
        console.error("Error:", e);
    }
}

// User cases
test("Buy milk 7 February");
test("Meeting tomorrow at 3pm");
test("Gym every monday");
test("Lunch on 12th Feb @personal");
test("Submit report by next Friday !1hour");
