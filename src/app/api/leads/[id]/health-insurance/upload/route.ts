import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { uploadFileToS3 } from '@/utils/s3Upload';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const category = formData.get('category') as string || 'docs';
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const { url, originalFileName } = await uploadFileToS3(file, id, category as 'docs' | 'payment' | 'verification', 'health-insurance');
    
    return NextResponse.json({ 
      success: true, 
      fileUrl: url,
      fileName: originalFileName
    });
  } catch (error) {
    console.error('Error uploading health insurance file:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
} 