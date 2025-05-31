import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import HealthInsuranceVerification from '@/models/HealthInsuranceVerification';
import { uploadFile } from '@/utils/fileUpload';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const leadId = params.id;
    const formData = await req.formData();
    const file = formData.get('video') as File;
    if (!file) {
      return NextResponse.json({ error: 'No video file provided' }, { status: 400 });
    }
    const filePath = await uploadFile(file, leadId, 'health-insurance/plvc-video');
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
    console.error('Error uploading PLVC video:', error);
    return NextResponse.json({ error: 'Failed to upload video' }, { status: 500 });
  }
} 