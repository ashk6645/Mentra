/**
 * Email Notification Service
 * Sends reminder emails using Resend
 */

import { Resend } from 'resend'
import { format } from 'date-fns'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface ReminderEmailData {
    to: string
    userName: string
    taskTitle: string
    taskDescription?: string
    dueDate?: Date
    taskUrl: string
}

/**
 * Send a single task reminder email
 */
export async function sendReminderEmail(data: ReminderEmailData): Promise<{
    success: boolean
    error?: string
}> {
    try {
        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 8px 8px 0 0;
            text-align: center;
        }
        .content {
            background: #f9fafb;
            padding: 30px;
            border-radius: 0 0 8px 8px;
        }
        .task-card {
            background: white;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #667eea;
            margin: 20px 0;
        }
        .task-title {
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 10px;
        }
        .task-description {
            color: #6b7280;
            margin-bottom: 15px;
        }
        .due-date {
            color: #ef4444;
            font-weight: 500;
        }
        .cta-button {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            margin-top: 20px;
        }
        .footer {
            text-align: center;
            color: #9ca3af;
            font-size: 12px;
            margin-top: 30px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>⏰ Task Reminder</h1>
    </div>
    <div class="content">
        <p>Hi ${data.userName},</p>
        <p>This is a friendly reminder about your upcoming task:</p>
        
        <div class="task-card">
            <div class="task-title">${data.taskTitle}</div>
            ${data.taskDescription ? `<div class="task-description">${data.taskDescription}</div>` : ''}
            ${data.dueDate ? `<div class="due-date">📅 Due: ${format(data.dueDate, 'PPP p')}</div>` : ''}
        </div>
        
        <a href="${data.taskUrl}" class="cta-button">View Task</a>
        
        <p style="margin-top: 30px; color: #6b7280;">
            Stay productive! 🚀
        </p>
    </div>
    <div class="footer">
        <p>You're receiving this because you have notifications enabled in Mentra.</p>
        <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/settings">Manage notification preferences</a></p>
    </div>
</body>
</html>
        `

        await resend.emails.send({
            from: 'Mentra <notifications@mentra.app>',
            to: data.to,
            subject: `⏰ Reminder: ${data.taskTitle}`,
            html: emailHtml,
        })

        return { success: true }
    } catch (error) {
        console.error('Error sending reminder email:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        }
    }
}

/**
 * Send daily digest email
 */
export async function sendDigestEmail(
    to: string,
    userName: string,
    tasks: Array<{
        title: string
        dueDate?: Date
        priority?: string
    }>
): Promise<{ success: boolean; error?: string }> {
    try {
        const tasksList = tasks.map(task => `
            <li style="margin-bottom: 15px;">
                <strong>${task.title}</strong>
                ${task.dueDate ? `<br><span style="color: #6b7280;">Due: ${format(task.dueDate, 'PPP')}</span>` : ''}
                ${task.priority ? `<br><span style="color: #ef4444;">Priority: ${task.priority}</span>` : ''}
            </li>
        `).join('')

        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            border-radius: 8px 8px 0 0;
            text-align: center;
        }
        .content {
            background: #f9fafb;
            padding: 30px;
            border-radius: 0 0 8px 8px;
        }
        ul {
            list-style: none;
            padding: 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📋 Your Daily Task Digest</h1>
    </div>
    <div class="content">
        <p>Hi ${userName},</p>
        <p>Here's your summary of upcoming tasks:</p>
        <ul>${tasksList}</ul>
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/tasks" style="display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">
            View All Tasks
        </a>
    </div>
</body>
</html>
        `

        await resend.emails.send({
            from: 'Mentra <digest@mentra.app>',
            to,
            subject: `📋 Your Daily Task Digest - ${format(new Date(), 'PPP')}`,
            html: emailHtml,
        })

        return { success: true }
    } catch (error) {
        console.error('Error sending digest email:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        }
    }
}
