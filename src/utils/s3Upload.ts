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
 * Upload attendance photo to S3 with user folder structure
 * @param photoData Base64 photo data
 * @param userId User ID
 * @param userName User's name for folder structure
 * @param type 'check-in' or 'check-out'
 * @returns Promise with uploaded file URL and key
 */
export const uploadAttendancePhotoToS3 = async (
  photoData: string,
  userId: string,
  userName: string,
  type: 'check-in' | 'check-out'
) => {
  try {
    // Remove data URL prefix to get base64 data
    const base64Data = photoData.replace(/^data:image\/[a-z]+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Create unique filename with timestamp
    const timestamp = Date.now();
    const fileName = `${type}-${timestamp}.jpg`;
    
    // Create folder structure: attendance/{userName}/{userId}/{filename}
    const key = `attendance/${userName.replace(/\s+/g, '-').toLowerCase()}/${userId}/${fileName}`;
    
    const publicUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: key,
      Body: buffer,
      ContentType: 'image/jpeg',
    });

    await s3Client.send(command);

    return { url: publicUrl, key, fileName };
  } catch (error) {
    console.error('Error uploading attendance photo to S3:', error);
    throw new Error('Failed to upload attendance photo to S3.');
  }
};

/**
 * A reusable utility to upload files to an S3 bucket with an organized structure.
 * @param file The file to upload.
 * @param leadId The ID of the lead to associate the file with.
 * @param category The category for the upload (e.g., 'docs', 'payment', 'verification').
 * @param insuranceType The type of insurance (e.g., 'term-insurance', 'life-insurance', 'health-insurance', 'car-insurance').
 * @returns A promise that resolves with the public URL and S3 key of the uploaded file.
 */
export const uploadFileToS3 = async (
  file: File,
  leadId: string,
  category: 'docs' | 'payment' | 'verification',
  insuranceType: 'term-insurance' | 'life-insurance' | 'health-insurance' | 'car-insurance' = 'term-insurance'
) => {
  try {
    const fileExtension = path.extname(file.name);
    const uniqueFileName = `${uuidv4()}${fileExtension}`;
    const key = `${insuranceType}/${leadId}/${category}/${uniqueFileName}`;

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