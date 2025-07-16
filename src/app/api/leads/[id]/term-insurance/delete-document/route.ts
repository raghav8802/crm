import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import TermInsuranceVerification from '@/models/TermInsuranceVerification';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const leadId = params.id;
    const { documentType, fileIndex } = await request.json();

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

    const fileToDelete = documentGroup.files[fileIndex];

    // Delete from S3
    try {
      const url = new URL(fileToDelete.url);
      const key = url.pathname.substring(1); // Remove leading slash
      
      await s3Client.send(new DeleteObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME!,
        Key: key,
      }));
    } catch (s3Error) {
      console.error('Error deleting from S3:', s3Error);
      // Continue with database update even if S3 deletion fails
    }

    // Remove the file from the array
    documentGroup.files.splice(fileIndex, 1);

    // If no files left in the group, remove the entire group
    if (documentGroup.files.length === 0) {
      if (documentType === 'Payment Screenshot' || documentType === 'BI File') {
        verification.paymentDocuments = verification.paymentDocuments?.filter(
          (doc: Record<string, unknown>) => doc.documentType !== documentType
        ) || [];
      } else {
        verification.documents = verification.documents?.filter(
          (doc: Record<string, unknown>) => doc.documentType !== documentType
        ) || [];
      }
    }

    // Save the updated verification
    await verification.save();

    return NextResponse.json({
      success: true,
      data: verification
    });

  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
} 