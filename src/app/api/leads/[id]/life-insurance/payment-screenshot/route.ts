import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import LifeInsuranceVerification from '@/models/LifeInsuranceVerification';
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
    const type = formData.get('type') as 'payment' | 'bi';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Check file type based on upload type
    if (type === 'payment') {
      if (!file.type.startsWith('image/')) {
        return NextResponse.json(
          { error: 'Please upload only image files (JPG, PNG, etc.)' },
          { status: 400 }
        );
      }
    } else if (type === 'bi') {
      if (!file.type.startsWith('image/') && !file.type.startsWith('application/pdf')) {
        return NextResponse.json(
          { error: 'Please upload only image files (JPG, PNG) or PDF files' },
          { status: 400 }
        );
      }
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size should be less than 10MB' },
        { status: 400 }
      );
    }

    // Find the verification record
    const verification = await (LifeInsuranceVerification as any).findOne({ leadId: id });
    if (!verification) {
      return NextResponse.json(
        { error: 'Verification not found' },
        { status: 404 }
      );
    }

    // Upload file to S3
    const category = type === 'payment' ? 'payment' : 'payment';
    const { url, originalFileName } = await uploadFileToS3(file, id, category, 'life-insurance');

    // Initialize paymentDocuments array if it doesn't exist
    if (!verification.paymentDocuments) {
      verification.paymentDocuments = [];
    }

    const documentType = type === 'payment' ? 'Payment Screenshot' : 'BI File';

    // Find existing document group
    const documentGroup = verification.paymentDocuments.find((doc: Record<string, unknown>) => doc.documentType === documentType);

    if (documentGroup) {
      // If group exists, update its files
      documentGroup.files = [{
        url: url,
        fileName: originalFileName,
      }];
    } else {
      // If group doesn't exist, create and push it with the file
      verification.paymentDocuments.push({
        documentType: documentType,
        files: [{
          url: url,
          fileName: originalFileName,
        }]
      });
    }

    // Mark as modified to ensure save
    verification.markModified('paymentDocuments');

    // Save the updated verification
    await verification.save();

    return NextResponse.json({
      success: true,
      data: verification
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
} 