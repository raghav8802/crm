import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { uploadFile } from '@/utils/fileUpload';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const leadId = params.id;
    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    // Save the file in a folder named after the leadId
    const filePath = await uploadFile(file, leadId, `health-insurance/${leadId}`);
    return NextResponse.json({ success: true, fileUrl: filePath });
  } catch (error) {
    console.error('Error uploading health insurance file:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
} 