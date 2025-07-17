import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import CarInsuranceVerification from '@/models/CarInsuranceVerification';
import { uploadFileToS3 } from '@/utils/s3Upload';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const formData = await req.formData();
    const videoFile = formData.get('video') as File;

    if (!videoFile) {
      return NextResponse.json(
        { error: 'No video file provided' },
        { status: 400 }
      );
    }

    // Upload video file
    const { url } = await uploadFileToS3(videoFile, id, 'verification', 'car-insurance');

    // Update verification record with video path
    const verification = await (CarInsuranceVerification as any).findOneAndUpdate(
      { leadId: id },
      { $set: { plvcVideo: url } },
      { new: true }
    );

    if (!verification) {
      return NextResponse.json(
        { error: 'Verification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      videoUrl: url 
    });
  } catch (error) {
    console.error('Error uploading video:', error);
    return NextResponse.json(
      { error: 'Failed to upload video' },
      { status: 500 }
    );
  }
} 