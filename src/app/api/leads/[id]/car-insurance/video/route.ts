import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import CarInsuranceVerification from '@/models/CarInsuranceVerification';
import { uploadFile } from '@/utils/fileUpload';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const leadId = params.id;
    const formData = await req.formData();
    const videoFile = formData.get('video') as File;

    if (!videoFile) {
      return NextResponse.json(
        { error: 'No video file provided' },
        { status: 400 }
      );
    }

    // Upload video file
    const videoPath = await uploadFile(videoFile, leadId, 'car-insurance-plvc');

    // Update verification record with video path
    const verification = await CarInsuranceVerification.findOneAndUpdate(
      { leadId },
      { $set: { plvcVideo: videoPath } },
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
      videoUrl: videoPath 
    });
  } catch (error) {
    console.error('Error uploading video:', error);
    return NextResponse.json(
      { error: 'Failed to upload video' },
      { status: 500 }
    );
  }
} 