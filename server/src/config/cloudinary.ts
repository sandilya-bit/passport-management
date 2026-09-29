import { v2 as cloudinary } from 'cloudinary';
import { env } from './env';
import { ApiError } from '../utils/api-error';

const configured = Boolean(env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET);

if (configured) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export async function uploadDocument(file: Express.Multer.File) {
  if (!configured) throw new ApiError(503, 'Document storage is not configured.');

  return new Promise<{ publicId: string; secureUrl: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'pams/documents',
        resource_type: 'raw',
        type: 'authenticated',
        access_mode: 'authenticated',
        use_filename: false,
        unique_filename: true,
      },
      (error, result) => {
        if (error || !result) return reject(new ApiError(502, 'Document storage upload failed.'));
        resolve({ publicId: result.public_id, secureUrl: result.secure_url });
      },
    );
    stream.end(file.buffer);
  });
}

export function createDocumentDownloadUrl(publicId: string, originalName: string) {
  if (!configured) throw new ApiError(503, 'Document storage is not configured.');
  const extension = originalName.split('.').pop()?.replace(/[^a-zA-Z0-9]/g, '') || 'bin';
  return cloudinary.utils.private_download_url(publicId, extension, {
    expires_at: Math.floor(Date.now() / 1000) + 300,
    attachment: true,
  });
}

export async function deleteStoredDocument(publicId: string) {
  if (!configured) return;
  await cloudinary.uploader.destroy(publicId, { resource_type: 'raw', type: 'authenticated' });
}