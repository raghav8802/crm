import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import LifeInsuranceVerification from '@/models/LifeInsuranceVerification';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const leadId = params.id;
    const { searchParams } = new URL(request.url);
    const documentType = searchParams.get('documentType') as 'Payment Screenshot' | 'BI File';
    const fileIndex = parseInt(searchParams.get('fileIndex') || '0');

    if (!documentType) {
      return NextResponse.json(
        { error: 'Document type is required' },
        { status: 400 }
      );
    }

    // Find the verification record
    const verification = await LifeInsuranceVerification.findOne({ leadId });
    if (!verification) {
      return NextResponse.json(
        { error: 'Verification not found' },
        { status: 404 }
      );
    }

    // Initialize paymentDocuments array if it doesn't exist
    if (!verification.paymentDocuments) {
      verification.paymentDocuments = [];
    }

    // Find the document group
    const documentGroupIndex = verification.paymentDocuments.findIndex(
      (doc: { documentType: string }) => doc.documentType === documentType
    );

    if (documentGroupIndex === -1) {
      return NextResponse.json(
        { error: 'Document group not found' },
        { status: 404 }
      );
    }

    const documentGroup = verification.paymentDocuments[documentGroupIndex];

    // Check if file index is valid
    if (fileIndex < 0 || fileIndex >= documentGroup.files.length) {
      return NextResponse.json(
        { error: 'Invalid file index' },
        { status: 400 }
      );
    }

    // Remove the file from the array
    documentGroup.files.splice(fileIndex, 1);

    // If no files remain in the group, remove the entire group
    if (documentGroup.files.length === 0) {
      verification.paymentDocuments.splice(documentGroupIndex, 1);
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
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
} 