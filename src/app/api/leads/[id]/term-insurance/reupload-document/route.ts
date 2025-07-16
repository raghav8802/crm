import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import TermInsuranceVerification from '@/models/TermInsuranceVerification';
import { S3Client, DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const leadId = params.id;
    const formData = await request.formData();
    
    const file = formData.get('document') as File;
    const documentType = formData.get('documentType') as string;
    const fileIndex = parseInt(formData.get('fileIndex') as string);

    if (!file || !documentType || isNaN(fileIndex)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Find the verification record
    const verification = await TermInsuranceVerification.findOne({ leadId });
    if (!verification) {
      return NextResponse.json(
        { error: 'Verification not found' },
        { status: 404 }
      );
    }

    // Find the document group
    let documentGroup;
    
    if (documentType === 'Payment Screenshot' || documentType === 'BI File') {
      documentGroup = verification.paymentDocuments?.find((doc: Record<string, unknown>) => doc.documentType === documentType);
    } else {
      documentGroup = verification.documents?.find((doc: Record<string, unknown>) => doc.documentType === documentType);
    }

    if (!documentGroup || !documentGroup.files[fileIndex]) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    const oldFile = documentGroup.files[fileIndex];

    // Delete old file from S3
    try {
      const oldUrl = new URL(oldFile.url);
      const oldKey = oldUrl.pathname.substring(1); // Remove leading slash
      
      await s3Client.send(new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: oldKey,
      }));
    } catch (s3Error) {
      console.error('Error deleting old file from S3:', s3Error);
      // Continue with upload even if old file deletion fails
    }

    // Upload new file to S3
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.name}`;
    const key = `term-insurance/${leadId}/${documentType.toLowerCase().replace(' ', '-')}/${fileName}`;

    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    }));

    const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

    // Update the file in the array
    documentGroup.files[fileIndex] = {
      url: fileUrl,
      fileName: file.name,
    };

    // Save the updated verification
    await verification.save();

    return NextResponse.json({
      success: true,
      data: verification
    });

  } catch (error) {
    console.error('Error re-uploading document:', error);
    return NextResponse.json(
      { error: 'Failed to re-upload document' },
      { status: 500 }
    );
  }
} 