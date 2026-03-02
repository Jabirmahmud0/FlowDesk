import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * Cloudinary Upload API Route
 *
 * Accepts a file upload and proxies it to Cloudinary using the
 * unsigned upload preset or signed upload with API credentials.
 *
 * POST /api/upload
 * Body: FormData with `file` field
 * Returns: { url, publicId, filename, size }
 */
export async function POST(req: NextRequest) {
    try {
        // Verify the user is authenticated
        const session = await auth();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
        const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;
        const apiKey = process.env.CLOUDINARY_API_KEY;
        const apiSecret = process.env.CLOUDINARY_API_SECRET;

        if (!cloudName) {
            return NextResponse.json(
                { error: 'Cloudinary not configured. Set CLOUDINARY_CLOUD_NAME.' },
                { status: 503 }
            );
        }

        const formData = await req.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // File size limit: 10MB
        const MAX_SIZE = 10 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
            return NextResponse.json(
                { error: 'File too large. Maximum size is 10MB.' },
                { status: 413 }
            );
        }

        // Allowed file types
        const ALLOWED_TYPES = [
            'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
            'application/pdf',
            'text/plain', 'text/csv',
            'application/zip',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ];
        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: `File type ${file.type} is not allowed.` },
                { status: 415 }
            );
        }

        // Build Cloudinary upload form
        const cloudinaryForm = new FormData();
        cloudinaryForm.append('file', file);
        cloudinaryForm.append('folder', 'flowdesk/attachments');

        if (uploadPreset) {
            // Unsigned upload with preset
            cloudinaryForm.append('upload_preset', uploadPreset);
        } else if (apiKey && apiSecret) {
            // Signed upload
            const timestamp = Math.round(Date.now() / 1000);
            const signaturePayload = `folder=flowdesk/attachments&timestamp=${timestamp}${apiSecret}`;
            const encoder = new TextEncoder();
            const data = encoder.encode(signaturePayload);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const signature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

            cloudinaryForm.append('api_key', apiKey);
            cloudinaryForm.append('timestamp', timestamp.toString());
            cloudinaryForm.append('signature', signature);
        } else {
            return NextResponse.json(
                { error: 'Cloudinary credentials not configured. Set CLOUDINARY_UPLOAD_PRESET or API key/secret.' },
                { status: 503 }
            );
        }

        const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;
        const response = await fetch(uploadUrl, {
            method: 'POST',
            body: cloudinaryForm,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            console.error('[Upload] Cloudinary error:', error);
            return NextResponse.json(
                { error: 'Upload failed', details: error },
                { status: 502 }
            );
        }

        const result = await response.json();

        return NextResponse.json({
            url: result.secure_url as string,
            publicId: result.public_id as string,
            filename: file.name,
            size: file.size,
            format: result.format as string,
            resourceType: result.resource_type as string,
        });
    } catch (error) {
        console.error('[Upload] Unexpected error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
