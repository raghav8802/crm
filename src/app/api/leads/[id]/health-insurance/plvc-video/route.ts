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
    const files = formData.getAll('files') as File[];
    const documentType = formData.get('documentType') as string || 'Verification Call';

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    // Validate all files
    for (const file of files) {
      if (!file.type.startsWith('video/') && !file.type.startsWith('audio/')) {
        return NextResponse.json({ error: 'Only video and audio files are allowed' }, { status: 400 });
      }
      if (file.size > 100 * 1024 * 1024) { // 100MB limit
        return NextResponse.json({ error: 'File size should be less than 100MB' }, { status: 400 });
      }
    }

    // Upload all files to S3
    const uploadPromises = files.map(async (file) => {
      const { url, originalFileName } = await uploadFileToS3(file, id, 'verification', 'health-insurance');
      return {
        fileType: file.type.startsWith('video/') ? 'video' : 'audio',
        url,
        fileName: originalFileName
      };
    });

    const uploadedFiles = await Promise.all(uploadPromises);

    // Find existing verification record
    const verification = await (HealthInsuranceVerification as any).findOne({ leadId: id });
    
    if (!verification) {
      return NextResponse.json({ error: 'Verification record not found' }, { status: 404 });
    }

    // Initialize verificationDocuments array if it doesn't exist
    if (!verification.verificationDocuments) {
      verification.verificationDocuments = [];
    }

    // Find existing document of the same type or create new one
    const existingDocument = verification.verificationDocuments.find((doc: { documentType: string }) => doc.documentType === documentType);
    
    if (existingDocument) {
      // Add new files to existing document
      existingDocument.files.push(...uploadedFiles);
    } else {
      // Create new document
      verification.verificationDocuments.push({
        documentType: documentType as 'Sales Audio' | 'Verification Call' | 'Welcome Call',
        files: uploadedFiles
      });
    }

    // Update status to PLVC_verification if not already
    if (verification.status === 'payment_done') {
      verification.status = 'PLVC_verification';
    }

    await verification.save();

    return NextResponse.json({
      success: true,
      data: verification,
      message: `${documentType} files uploaded successfully`
    });

  } catch (error) {
    console.error('Error uploading verification files:', error);
    return NextResponse.json(
      { error: 'Failed to upload verification files' },
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
      verificationDocuments: verification.verificationDocuments || []
    });

  } catch (error) {
    console.error('Error fetching verification documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch verification documents' },
      { status: 500 }
    );
  }
} 