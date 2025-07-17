import { NextRequest, NextResponse } from 'next/server';
import  connectDB  from '@/lib/db';
import  CarInsuranceVerification  from '@/models/CarInsuranceVerification';
import fs from 'fs';
import path from 'path';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const formData = await request.formData();
    const file = formData.get('screenshot') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, message: 'Only image files are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: 'File size should be less than 10MB' },
        { status: 400 }
      );
    }

    // Create uploads directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'car-insurance', 'payment-screenshots');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const filename = `${timestamp}-${originalName}`;
    const filepath = path.join(uploadDir, filename);

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    fs.writeFileSync(filepath, buffer);

    // Update verification document
    const verification = await (CarInsuranceVerification as any).findOneAndUpdate(
      { leadId: id },
      {
        $set: {
          paymentScreenshot: `/uploads/car-insurance/payment-screenshots/${filename}`,
          status: 'payment_done'
        }
      },
      { new: true }
    );

    if (!verification) {
      return NextResponse.json(
        { success: false, message: 'Verification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: verification
    });

  } catch (error) {
    console.error('Error uploading payment screenshot:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to upload payment screenshot' },
      { status: 500 }
    );
  }
} 