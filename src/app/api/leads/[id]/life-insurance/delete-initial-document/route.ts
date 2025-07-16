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
    const documentType = searchParams.get('documentType') as 'PAN' | 'Aadhaar' | 'Photo' | 'Cancelled Cheque' | 'Bank Statement' | 'Other';
    const fileIndex = parseInt(searchParams.get('fileIndex') || '0');
    const category = searchParams.get('category') as 'proposer' | 'la';

    if (!documentType || !category) {
      return NextResponse.json(
        { error: 'Document type and category are required' },
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

    // Initialize documents object if it doesn't exist
    if (!verification.documents) {
      verification.documents = {
        proposerDocuments: [],
        laDocuments: []
      };
    }

    // Select the appropriate document array
    const documentArray = category === 'proposer' ? verification.documents.proposerDocuments : verification.documents.laDocuments;

    // Find the document group
    const documentGroupIndex = documentArray.findIndex(
      (doc: { documentType: string }) => doc.documentType === documentType
    );

    if (documentGroupIndex === -1) {
      return NextResponse.json(
        { error: 'Document group not found' },
        { status: 404 }
      );
    }

    const documentGroup = documentArray[documentGroupIndex];

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
      documentArray.splice(documentGroupIndex, 1);
    }

    // Mark as modified to ensure save
    verification.markModified('documents');

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