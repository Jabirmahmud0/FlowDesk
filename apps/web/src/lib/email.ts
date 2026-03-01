import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY;

export const resend = resendApiKey ? new Resend(resendApiKey) : null;

export async function sendEmail({
    to,
    subject,
    react,
}: {
    to: string;
    subject: string;
    react: React.ReactElement;
}) {
    if (!resend) {
        console.warn('RESEND_API_KEY is not set. Skipping email send to:', to);
        return { success: true, dummy: true };
    }

    try {
        const { data, error } = await resend.emails.send({
            from: 'FlowDesk <noreply@flowdesk.app>',
            to: [to],
            subject,
            react,
        });

        if (error) {
            console.error('Failed to send email:', error);
            throw new Error(error.message);
        }

        return { success: true, data };
    } catch (err: any) {
        console.error('Exception sending email:', err);
        throw new Error(err.message || 'Error sending email');
    }
}
