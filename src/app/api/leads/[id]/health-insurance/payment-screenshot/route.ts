import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import HealthInsuranceVerification from '@/models/HealthInsuranceVerification';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const formData = await request.formData();
    const file = formData.get('screenshot') as File;
    
    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ success: false, error: 'Only image files are allowed' }, { status: 400 });
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: 'File size should be less than 10MB' }, { status: 400 });
    }

    await connectDB();

    // Create directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'health-insurance', 'payment-screenshots', params.id);
    await createDirIfNotExists(uploadDir);

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name}`;
    const filePath = path.join(uploadDir, filename);

    // Convert File to Buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Generate public URL
    const publicUrl = `/uploads/health-insurance/payment-screenshots/${params.id}/${filename}`;

    // Update verification document
    const verification = await HealthInsuranceVerification.findOneAndUpdate(
      { leadId: params.id },
      { 
        $set: { 
          paymentScreenshot: publicUrl,
          status: 'payment_done'
        }
      },
      { new: true }
    );

    if (!verification) {
      return NextResponse.json({ success: false, error: 'Verification not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: verification });
  } catch (error) {
    console.error('Error uploading payment screenshot:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload payment screenshot' },
      { status: 500 }
    );
  }
}

// Helper function to create directory if it doesn't exist
async function createDirIfNotExists(dirPath: string) {
  try {
    await mkdir(dirPath, { recursive: true });
  } catch (error: any) {
    if (error.code !== 'EEXIST') {
      throw error;
    }
  }
} 