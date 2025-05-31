import { writeFile } from 'fs/promises';
import { mkdir } from 'fs/promises';
import path from 'path';

export async function uploadFile(file: File, leadId: string, insuranceType: string): Promise<string> {
  try {
    // Create directory path
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', insuranceType, leadId);
    
    // Ensure directory exists
    await createDirIfNotExists(uploadDir);

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.name;
    const extension = path.extname(originalName);
    const filename = `${timestamp}-${originalName}`;
    const filePath = path.join(uploadDir, filename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Return relative path for database storage
    return `/uploads/${insuranceType}/${leadId}/${filename}`;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error('Failed to upload file');
  }
}

async function createDirIfNotExists(dirPath: string): Promise<void> {
  try {
    await mkdir(dirPath, { recursive: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
      throw error;
    }
  }
} 