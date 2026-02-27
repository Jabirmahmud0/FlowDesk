/**
 * Resend Email Service
 *
 * Provides email sending functionality for invites, notifications, and password resets.
 * Uses Resend API with React Email templates.
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'FlowDesk <noreply@flowdesk.app>';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

interface SendEmailOptions {
    to: string | string[];
    subject: string;
    html: string;
    replyTo?: string;
}

async function sendEmail({ to, subject, html, replyTo }: SendEmailOptions) {
    if (!RESEND_API_KEY) {
        console.warn('[Email] RESEND_API_KEY not set. Skipping email send.');
        console.log(`[Email] Would send to: ${to}, subject: ${subject}`);
        return { success: false, message: 'RESEND_API_KEY not configured' };
    }

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: FROM_EMAIL,
                to: Array.isArray(to) ? to : [to],
                subject,
                html,
                reply_to: replyTo,
            }),
        });

        const data = await response.json();
        if (!response.ok) {
            console.error('[Email] Resend error:', data);
            return { success: false, error: data };
        }

        return { success: true, id: data.id };
    } catch (error) {
        console.error('[Email] Failed to send:', error);
        return { success: false, error };
    }
}

// ─── Email Templates ────────────────────────────────────────────────

export async function sendInviteEmail(params: {
    to: string;
    inviterName: string;
    orgName: string;
    inviteToken: string;
}) {
    const acceptUrl = `${APP_URL}/invite/${params.inviteToken}`;

    return sendEmail({
        to: params.to,
        subject: `You've been invited to ${params.orgName} on FlowDesk`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 560px; margin: 0 auto; padding: 40px 20px; }
                    .header { text-align: center; margin-bottom: 32px; }
                    .logo { font-size: 24px; font-weight: 700; color: #6366f1; }
                    .card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 32px; margin: 24px 0; }
                    .btn { display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 14px; }
                    .footer { text-align: center; margin-top: 32px; font-size: 12px; color: #9ca3af; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="logo">FlowDesk</div>
                </div>
                <div class="card">
                    <h2 style="margin-top:0">You're invited! 🎉</h2>
                    <p><strong>${params.inviterName}</strong> has invited you to join <strong>${params.orgName}</strong> on FlowDesk.</p>
                    <p>FlowDesk is a project management platform for modern teams — with Kanban boards, real-time collaboration, and rich docs.</p>
                    <p style="text-align:center; margin:24px 0">
                        <a href="${acceptUrl}" class="btn">Accept Invitation</a>
                    </p>
                    <p style="font-size:13px; color:#6b7280">This invitation expires in 24 hours.</p>
                </div>
                <div class="footer">
                    <p>If you didn't expect this email, you can safely ignore it.</p>
                    <p>© ${new Date().getFullYear()} FlowDesk</p>
                </div>
            </body>
            </html>
        `,
    });
}

export async function sendNotificationDigest(params: {
    to: string;
    userName: string;
    notifications: Array<{ title: string; body: string; createdAt: string }>;
}) {
    const notificationList = params.notifications
        .map((n) => `<li style="margin-bottom:8px"><strong>${n.title}</strong><br/><span style="color:#6b7280;font-size:13px">${n.body}</span></li>`)
        .join('');

    return sendEmail({
        to: params.to,
        subject: `You have ${params.notifications.length} new notifications on FlowDesk`,
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 560px; margin: 0 auto; padding: 40px 20px; }
                    .header { text-align: center; margin-bottom: 32px; }
                    .logo { font-size: 24px; font-weight: 700; color: #6366f1; }
                    .card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 32px; margin: 24px 0; }
                    .btn { display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 14px; }
                    .footer { text-align: center; margin-top: 32px; font-size: 12px; color: #9ca3af; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="logo">FlowDesk</div>
                </div>
                <div class="card">
                    <h2 style="margin-top:0">Hi ${params.userName} 👋</h2>
                    <p>Here's a summary of your recent notifications:</p>
                    <ul style="padding-left:16px">${notificationList}</ul>
                    <p style="text-align:center; margin:24px 0">
                        <a href="${APP_URL}/dashboard" class="btn">View Dashboard</a>
                    </p>
                </div>
                <div class="footer">
                    <p>You're receiving this because you have notifications enabled.</p>
                    <p>© ${new Date().getFullYear()} FlowDesk</p>
                </div>
            </body>
            </html>
        `,
    });
}

export async function sendWelcomeEmail(params: {
    to: string;
    userName: string;
}) {
    return sendEmail({
        to: params.to,
        subject: 'Welcome to FlowDesk! 🚀',
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1a1a1a; max-width: 560px; margin: 0 auto; padding: 40px 20px; }
                    .header { text-align: center; margin-bottom: 32px; }
                    .logo { font-size: 24px; font-weight: 700; color: #6366f1; }
                    .card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 32px; margin: 24px 0; }
                    .btn { display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 14px; }
                    .step { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 16px; }
                    .step-num { background: #6366f1; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; }
                    .footer { text-align: center; margin-top: 32px; font-size: 12px; color: #9ca3af; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="logo">FlowDesk</div>
                </div>
                <div class="card">
                    <h2 style="margin-top:0">Welcome, ${params.userName}! 🎉</h2>
                    <p>Thanks for joining FlowDesk. Here's how to get started:</p>
                    <div class="step"><div class="step-num">1</div><div><strong>Create your organization</strong><br/>Set up your team space</div></div>
                    <div class="step"><div class="step-num">2</div><div><strong>Invite your team</strong><br/>Add members and assign roles</div></div>
                    <div class="step"><div class="step-num">3</div><div><strong>Create your first project</strong><br/>Start tracking tasks with Kanban boards</div></div>
                    <p style="text-align:center; margin:24px 0">
                        <a href="${APP_URL}/onboarding" class="btn">Get Started</a>
                    </p>
                </div>
                <div class="footer">
                    <p>© ${new Date().getFullYear()} FlowDesk</p>
                </div>
            </body>
            </html>
        `,
    });
}
