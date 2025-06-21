import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

/**
 * A reusable utility to upload files to an S3 bucket with an organized structure.
 * @param file The file to upload.
 * @param leadId The ID of the lead to associate the file with.
 * @param category The category for the upload (e.g., 'docs', 'payment', 'verification').
 * @returns A promise that resolves with the public URL and S3 key of the uploaded file.
 */
export const uploadFileToS3 = async (
  file: File,
  leadId: string,
  category: 'docs' | 'payment' | 'verification'
) => {
  try {
    const fileExtension = path.extname(file.name);
    const uniqueFileName = `${uuidv4()}${fileExtension}`;
    const key = `term-insurance/${leadId}/${category}/${uniqueFileName}`;

    const publicUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: key,
      Body: Buffer.from(await file.arrayBuffer()),
      ContentType: file.type,
    });

    await s3Client.send(command);

    return { url: publicUrl, key, originalFileName: file.name };
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw new Error('Failed to upload file to S3.');
  }
}; 