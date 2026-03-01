import { Worker, Job } from 'bullmq';
import { emailQueueName, exportQueueName, EmailJobPayload, ExportJobPayload } from './client';

// COMMENTED OUT FOR NOW - Redis disabled
// const connection = {
//     host: process.env.UPSTASH_REDIS_REST_URL?.replace('https://', '') || 'localhost',
//     port: parseInt(process.env.UPSTASH_REDIS_PORT || '6379', 10),
//     password: process.env.UPSTASH_REDIS_REST_TOKEN,
//     tls: process.env.NODE_ENV === 'production' ? {} : undefined,
// };

import { sendEmail } from '../email';
import InviteEmail from '../../emails/InviteEmail';

// Email Worker - COMMENTED OUT FOR NOW
// export const emailWorker = new Worker<EmailJobPayload>(
//     emailQueueName,
//     async (job: Job<EmailJobPayload>) => {
//         console.log(`[EmailWorker] Processing job ${job.id} to ${job.data.to}`);
//
//         if (job.data.template === 'INVITATION') {
//             await sendEmail({
//                 to: job.data.to,
//                 subject: job.data.subject,
//                 react: InviteEmail({
//                     orgName: job.data.props.orgName,
//                     inviterName: job.data.props.inviterName,
//                     inviteUrl: job.data.props.inviteUrl,
//                 }),
//             });
//         }
//
//         console.log(`[EmailWorker] Finished processing job ${job.id}`);
//     },
//     { connection }
// );
//
// emailWorker.on('completed', (job) => {
//     console.log(`[EmailWorker] Job ${job.id} has completed!`);
// });
//
// emailWorker.on('failed', (job: Job<EmailJobPayload> | undefined, err: Error) => {
//     console.log(`[EmailWorker] Job ${job?.id} has failed with ${err.message}`);
// });
//
// // Export Worker - COMMENTED OUT FOR NOW
// export const exportWorker = new Worker<ExportJobPayload>(
//     exportQueueName,
//     async (job: Job<ExportJobPayload>) => {
//         console.log(`[ExportWorker] Processing export job ${job.id} for org ${job.data.orgId}`);
//         // TODO: Implement PDF/CSV export logic
//         console.log(`[ExportWorker] Finished processing job ${job.id}`);
//     },
//     { connection }
// );
//
// exportWorker.on('completed', (job) => {
//     console.log(`[ExportWorker] Job ${job.id} has completed!`);
// });
//
// exportWorker.on('failed', (job: Job<ExportJobPayload> | undefined, err: Error) => {
//     console.log(`[ExportWorker] Job ${job?.id} has failed with ${err.message}`);
// });

// No-op exports when Redis is disabled
export const emailWorker = null;
export const exportWorker = null;
