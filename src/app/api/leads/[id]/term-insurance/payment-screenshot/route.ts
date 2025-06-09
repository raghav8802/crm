import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import TermInsuranceVerification from '@/models/TermInsuranceVerification';
import fs from 'fs';
import path from 'path';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

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
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'term-insurance', 'payment-screenshots');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${params.id}_${timestamp}_${file.name}`;
    const filepath = path.join(uploadsDir, filename);

    // Convert File to Buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    fs.writeFileSync(filepath, buffer);

    // Update the verification document with the screenshot URL
    const screenshotUrl = `/uploads/term-insurance/payment-screenshots/${filename}`;
    const verification = await TermInsuranceVerification.findOneAndUpdate(
      { leadId: params.id },
      { 
        $set: { 
          paymentScreenshot: screenshotUrl,
          status: 'payment_done'
        } 
      },
      { new: true }
    );

    if (!verification) {
      // If verification not found, delete the uploaded file
      fs.unlinkSync(filepath);
      return NextResponse.json(
        { success: false, message: 'Verification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Payment screenshot uploaded successfully',
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