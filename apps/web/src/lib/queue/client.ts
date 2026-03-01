import { ConnectionOptions, Queue } from 'bullmq';

// COMMENTED OUT FOR NOW - Redis disabled
// const connection: ConnectionOptions = {
//     host: process.env.UPSTASH_REDIS_REST_URL?.replace('https://', '') || 'localhost',
//     port: parseInt(process.env.UPSTASH_REDIS_PORT || '6379', 10),
//     password: process.env.UPSTASH_REDIS_REST_TOKEN,
//     tls: process.env.NODE_ENV === 'production' ? {} : undefined,
// };

export const emailQueueName = 'email-jobs';
export const exportQueueName = 'export-jobs';

// Define typed payloads
export type EmailJobPayload = {
    to: string;
    subject: string;
    template: 'INVITATION' | 'BILLING_RECEIPT';
    props: any;
};

export type ExportJobPayload = {
    orgId: string;
    userId: string;
    exportType: 'WORKSPACE' | 'PROJECT';
};

// Initialize Queues - COMMENTED OUT FOR NOW
// export const emailQueue = new Queue<EmailJobPayload>(emailQueueName, { connection });
// export const exportQueue = new Queue<ExportJobPayload>(exportQueueName, { connection });

export async function addEmailJob(payload: EmailJobPayload) {
    throw new Error('Email queue is disabled - Redis not configured');
}

export async function addExportJob(payload: ExportJobPayload) {
    throw new Error('Export queue is disabled - Redis not configured');
}
