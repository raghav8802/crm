import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import HealthInsuranceVerification from '@/models/HealthInsuranceVerification';
import { uploadFileToS3 } from '@/utils/s3Upload';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const formData = await req.formData();
    const biFile = formData.get('biDocument') as File;

    if (!biFile) {
      return NextResponse.json(
        { error: 'No BI document file provided' },
        { status: 400 }
      );
    }

    // Upload BI document file
    const { url } = await uploadFileToS3(biFile, id, 'docs' as any, 'health-insurance');

    // Update verification record with BI document path
    const verification = await (HealthInsuranceVerification as any).findOneAndUpdate(
      { leadId: id },
      { $set: { biDocument: url } },
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
      biDocumentUrl: url 
    });
  } catch (error) {
    console.error('Error uploading BI document:', error);
    return NextResponse.json(
      { error: 'Failed to upload BI document' },
      { status: 500 }
    );
  }
} 