import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucketName = process.env.R2_BUCKET_NAME;
const publicUrl = process.env.R2_PUBLIC_URL;

if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
  console.warn('Cloudflare R2 environment variables are not fully configured.');
}

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: accessKeyId || '',
    secretAccessKey: secretAccessKey || '',
  },
});

/**
 * Generates a presigned URL for direct client-to-R2 upload
 */
export async function getPresignedUploadUrl(filename: string, contentType?: string, expiresIn = 3600) {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: filename,
    ...(contentType ? { ContentType: contentType } : {}),
  });

  return await getSignedUrl(r2Client, command, { expiresIn });
}

/**
 * Generates the public access URL for a file in R2
 */
export function getR2PublicUrl(filename: string): string {
  if (!publicUrl) {
    throw new Error('R2_PUBLIC_URL is not defined');
  }
  return `${publicUrl.replace(/\/$/, '')}/${filename}`;
}

/**
 * Uploads a file directly from the server to R2
 */
export async function uploadToR2(fileBuffer: Buffer | Uint8Array, filename: string, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: filename,
    Body: fileBuffer,
    ContentType: contentType,
  });

  await r2Client.send(command);
  return getR2PublicUrl(filename);
}

/**
 * Deletes a file from R2
 */
export async function deleteFromR2(filename: string) {
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: filename,
  });

  await r2Client.send(command);
}
