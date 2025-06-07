import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/db';
import { uploadFile } from '@/utils/fileUpload';
import LifeInsuranceVerification from '@/models/LifeInsuranceVerification';

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const formData = await request.formData();
    const file = formData.get('media') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type
    const isVideo = file.type.startsWith('video/');
    const isAudio = file.type.startsWith('audio/');
    
    if (!isVideo && !isAudio) {
      return NextResponse.json(
        { success: false, message: 'Only video and audio files are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, message: 'File size should be less than 100MB' },
        { status: 400 }
      );
    }

    // Upload file
    const filePath = await uploadFile(file, params.id, 'life-insurance');

    // Update database
    await connectToDatabase();
    const result = await LifeInsuranceVerification.findOneAndUpdate(
      { leadId: params.id },
      { $set: { plvcVideo: filePath } },
      { new: true }
    );

    if (!result) {
      return NextResponse.json(
        { success: false, message: 'Verification record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      data: result
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to upload file' },
      { status: 500 }
    );
  }
} 