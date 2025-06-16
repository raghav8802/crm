import { NextRequest, NextResponse } from 'next/server';
import  connectDB  from '@/lib/db';
import  LifeInsuranceVerification  from '@/models/LifeInsuranceVerification';
import fs from 'fs';
import path from 'path';

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string; // 'payment' or 'bi'

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type based on upload type
    if (type === 'payment' && !file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: 'Please upload only image files (JPG, PNG, etc.)' },
        { status: 400 }
      );
    }

    if (type === 'bi' && !file.type.includes('pdf')) {
      return NextResponse.json(
        { success: false, error: 'Please upload only PDF files' },
        { status: 400 }
      );
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File size should be less than 10MB' },
        { status: 400 }
      );
    }

    // Create directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'life-insurance', params.id);
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileExtension = type === 'payment' ? '.jpg' : '.pdf';
    const filename = `${type}-${timestamp}${fileExtension}`;
    const filepath = path.join(uploadDir, filename);

    // Convert file to buffer and save
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(filepath, buffer);

    // Generate URL for the file
    const fileUrl = `/uploads/life-insurance/${params.id}/${filename}`;

    // Update verification record
    const updateData = type === 'payment' 
      ? { paymentScreenshot: fileUrl }
      : { biDocument: fileUrl };

    const verification = await LifeInsuranceVerification.findOneAndUpdate(
      { leadId: params.id },
      updateData,
      { new: true }
    );

    if (!verification) {
      return NextResponse.json(
        { success: false, error: 'Verification record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: verification
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload file' },
      { status: 500 }
    );
  }
} 