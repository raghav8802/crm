import { NextResponse } from 'next/server';
import { uploadFileToS3 } from '@/utils/s3Upload';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const leadId = formData.get('leadId') as string;
    const category = formData.get('category') as 'docs' | 'payment' | 'verification';

    if (!file || !leadId || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: file, leadId, or category' },
        { status: 400 }
      );
    }

    // Use the new reusable utility
    const { url, key, originalFileName } = await uploadFileToS3(
      file,
      leadId,
      category
    );

    return NextResponse.json({
      url,
      key,
      fileName: originalFileName,
    });
  } catch (error) {
    console.error('Error in upload route:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
} 