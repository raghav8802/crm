import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import HealthInsuranceVerification from '@/models/HealthInsuranceVerification';
import { uploadFileToS3 } from '@/utils/s3Upload';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Upload file to S3
    const { url, originalFileName } = await uploadFileToS3(file, id, 'payment', 'health-insurance');

    // Find existing verification record
    const verification = await (HealthInsuranceVerification as any).findOne({ leadId: id });
    
    if (!verification) {
      return NextResponse.json({ error: 'Verification record not found' }, { status: 404 });
    }

    // Initialize paymentDocuments array if it doesn't exist
    if (!verification.paymentDocuments) {
      verification.paymentDocuments = [];
    }

    // Find existing Payment Screenshot document or create new one
    const paymentScreenshot = verification.paymentDocuments.find((doc: { documentType: string }) => doc.documentType === 'Payment Screenshot');
    
    if (paymentScreenshot) {
      // Update existing Payment Screenshot document
      paymentScreenshot.files.push({
        url,
        fileName: originalFileName
      });
    } else {
      // Create new Payment Screenshot document
      verification.paymentDocuments.push({
        documentType: 'Payment Screenshot',
        files: [{
          url,
          fileName: originalFileName
        }]
      });
    }

    // Update status to payment_done if not already
    if (verification.status === 'link_created') {
      verification.status = 'payment_done';
    }

    await verification.save();

    return NextResponse.json({
      success: true,
      data: verification,
      message: 'Payment screenshot uploaded successfully'
    });

  } catch (error) {
    console.error('Error uploading payment screenshot:', error);
    return NextResponse.json(
      { error: 'Failed to upload payment screenshot' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;

    const verification = await (HealthInsuranceVerification as any).findOne({ leadId: id });
    if (!verification) {
      return NextResponse.json(
        { error: 'Health insurance verification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      paymentDocuments: verification.paymentDocuments || []
    });

  } catch (error) {
    console.error('Error fetching payment documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment documents' },
      { status: 500 }
    );
  }
} 