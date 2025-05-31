import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import TermInsuranceVerification from '@/models/TermInsuranceVerification';
import { uploadFile } from '@/utils/fileUpload';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const leadId = params.id;
    const formData = await request.formData();
    const videoFile = formData.get('video') as File;
    if (!videoFile) {
      return NextResponse.json({ error: 'No video file provided' }, { status: 400 });
    }
    // Save the video file in a folder named after the leadId
    const videoPath = await uploadFile(videoFile, leadId, `term-insurance-plvc/${leadId}`);
    // Update the verification record
    const verification = await TermInsuranceVerification.findOneAndUpdate(
      { leadId },
      { plvcVideo: videoPath },
      { new: true }
    );
    if (!verification) {
      return NextResponse.json({ error: 'Verification not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, videoUrl: videoPath });
  } catch (error) {
    console.error('Error uploading term insurance video:', error);
    return NextResponse.json({ error: 'Failed to upload video' }, { status: 500 });
  }
} 