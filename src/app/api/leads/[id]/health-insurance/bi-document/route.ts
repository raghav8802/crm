import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import HealthInsuranceVerification from '@/models/HealthInsuranceVerification';
import { uploadFileToS3 } from '@/utils/s3Upload';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const leadId = params.id;
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const documentType = formData.get('documentType') as string || 'BI File';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Upload file to S3
    const { url, originalFileName } = await uploadFileToS3(file, leadId, 'payment', 'health-insurance');

    // Find existing verification record
    let verification = await HealthInsuranceVerification.findOne({ leadId });
    
    if (!verification) {
      return NextResponse.json({ error: 'Verification record not found' }, { status: 404 });
    }

    // Initialize paymentDocuments array if it doesn't exist
    if (!verification.paymentDocuments) {
      verification.paymentDocuments = [];
    }

    // Find existing BI File document or create new one
    let biDocument = verification.paymentDocuments.find((doc: any) => doc.documentType === 'BI File');
    
    if (biDocument) {
      // Update existing BI File document
      biDocument.files.push({
        url,
        fileName: originalFileName
      });
    } else {
      // Create new BI File document
      verification.paymentDocuments.push({
        documentType: 'BI File',
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
      message: 'BI document uploaded successfully'
    });

  } catch (error) {
    console.error('Error uploading BI document:', error);
    return NextResponse.json(
      { error: 'Failed to upload BI document' },
      { status: 500 }
    );
  }
} 