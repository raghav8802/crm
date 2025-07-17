import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import TermInsuranceVerification from '@/models/TermInsuranceVerification';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const formData = await request.formData();
    
    const file = formData.get('document') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Check file type
    if (!file.type.startsWith('image/') && !file.type.startsWith('application/pdf')) {
      return NextResponse.json(
        { error: 'Please upload only image files (JPG, PNG) or PDF files' },
        { status: 400 }
      );
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size should be less than 10MB' },
        { status: 400 }
      );
    }

    // Find the verification record
    const verification = await (TermInsuranceVerification as any).findOne({ leadId: id });
    if (!verification) {
      return NextResponse.json(
        { error: 'Verification not found' },
        { status: 404 }
      );
    }

    // Upload file to S3
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.name}`;
    const key = `term-insurance/${id}/bi-document/${fileName}`;

    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    }));

    const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    // Update or create payment documents array
    if (!verification.paymentDocuments) {
      verification.paymentDocuments = [];
    }

    // Find existing BI File group
    const biDocumentGroup = verification.paymentDocuments.find((doc: Record<string, unknown>) => doc.documentType === 'BI File');

    if (biDocumentGroup) {
      // If group exists, update its files
      biDocumentGroup.files = [{
        url: fileUrl,
        fileName: file.name,
      }];
    } else {
      // If group doesn't exist, create and push it with the file
      verification.paymentDocuments.push({
        documentType: 'BI File',
        files: [{
          url: fileUrl,
          fileName: file.name,
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
    console.error('Error uploading BI document:', error);
    return NextResponse.json(
      { error: 'Failed to upload BI document' },
      { status: 500 }
    );
  }
} 