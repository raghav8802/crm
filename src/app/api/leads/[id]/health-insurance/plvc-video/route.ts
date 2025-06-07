import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import HealthInsuranceVerification from '@/models/HealthInsuranceVerification';
import { uploadFile } from '@/utils/fileUpload';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const leadId = params.id;
    const formData = await req.formData();
    const file = formData.get('media') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No media file provided' }, { status: 400 });
    }

    // Validate file type
    const isVideo = file.type.startsWith('video/');
    const isAudio = file.type.startsWith('audio/');
    
    if (!isVideo && !isAudio) {
      return NextResponse.json(
        { error: 'Invalid file type. Only video (MP4, MOV) and audio (MP3, WAV) files are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (100MB limit)
    if (file.size > 100 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds 100MB limit' },
        { status: 400 }
      );
    }

    const filePath = await uploadFile(file, leadId, 'health-insurance/plvc-media');
    const verification = await HealthInsuranceVerification.findOneAndUpdate(
      { leadId },
      { $set: { plvcVideo: filePath } },
      { new: true }
    );

    if (!verification) {
      return NextResponse.json({ error: 'Verification not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: verification });
  } catch (error) {
    console.error('Error uploading PLVC media:', error);
    return NextResponse.json(
      { error: 'Failed to upload media file' },
      { status: 500 }
    );
  }
} 