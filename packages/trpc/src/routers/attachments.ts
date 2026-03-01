import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';
import { v2 as cloudinary } from 'cloudinary';
import { attachments } from '@flowdesk/db';
import { eq } from 'drizzle-orm';

// Ensure cloudinary is configured
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const attachmentsRouter = router({
    createUploadSignature: protectedProcedure
        .input(z.object({ folder: z.string().optional() }))
        .mutation(async ({ input }) => {
            const timestamp = Math.round(new Date().getTime() / 1000);
            const folder = input.folder || 'flowdesk_uploads';

            const signature = cloudinary.utils.api_sign_request(
                {
                    timestamp,
                    folder,
                },
                process.env.CLOUDINARY_API_SECRET!
            );

            return {
                timestamp,
                signature,
                folder,
                apiKey: process.env.CLOUDINARY_API_KEY,
                cloudName: process.env.CLOUDINARY_CLOUD_NAME,
            };
        }),

    registerAttachment: protectedProcedure
        .input(
            z.object({
                taskId: z.string().uuid(),
                url: z.string().url(),
                publicId: z.string(),
                filename: z.string(),
                size: z.number(),
                mimeType: z.string(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const [attachment] = await ctx.db
                .insert(attachments)
                .values({
                    taskId: input.taskId,
                    userId: ctx.user.id,
                    url: input.url,
                    publicId: input.publicId,
                    filename: input.filename,
                    size: input.size,
                    mimeType: input.mimeType,
                })
                .returning();

            return attachment;
        }),

    deleteAttachment: protectedProcedure
        .input(z.object({ id: z.string().uuid() }))
        .mutation(async ({ ctx, input }) => {
            // Get attachment details to find the publicId
            const [attachment] = await ctx.db
                .select()
                .from(attachments)
                .where(eq(attachments.id, input.id));

            if (!attachment) {
                throw new Error('Attachment not found');
            }

            // Tell Cloudinary to delete the file
            if (attachment.publicId) {
                await cloudinary.uploader.destroy(attachment.publicId);
            }

            // Remove from our database
            await ctx.db.delete(attachments).where(eq(attachments.id, input.id));

            return { success: true };
        }),
});
