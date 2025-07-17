import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import LifeInsuranceVerification from '@/models/LifeInsuranceVerification';
import { uploadFileToS3 } from '@/utils/s3Upload';

const proposerDocTypes = [
  { field: 'proposerPanPhoto', documentType: 'PAN' },
  { field: 'proposerAadharPhoto', documentType: 'Aadhaar' },
  { field: 'proposerPhoto', documentType: 'Photo' },
  { field: 'proposerCancelledCheque', documentType: 'Cancelled Cheque' },
  { field: 'proposerBankStatement', documentType: 'Bank Statement' },
  { field: 'proposerOtherDocument', documentType: 'Other' },
];
const laDocTypes = [
  { field: 'laPanPhoto', documentType: 'PAN' },
  { field: 'laAadharPhoto', documentType: 'Aadhaar' },
  { field: 'laPhoto', documentType: 'Photo' },
  { field: 'laCancelledCheque', documentType: 'Cancelled Cheque' },
  { field: 'laBankStatement', documentType: 'Bank Statement' },
  { field: 'laOtherDocument', documentType: 'Other' },
];

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const formData = await req.formData();

    // Prepare document arrays
    const proposerDocuments: Record<string, unknown>[] = [];
    const laDocuments: Record<string, unknown>[] = [];
    const paymentDocuments: Record<string, unknown>[] = [];
    const verificationDocuments: Record<string, unknown>[] = [];

    // Helper to add file to doc array
    const addFileToDocArray = async (arr: Record<string, unknown>[], documentType: string, file: File, leadId: string, category: 'docs' | 'payment' | 'verification') => {
      const { url, originalFileName } = await uploadFileToS3(file, leadId, category, 'life-insurance');
      let docGroup = arr.find((d: Record<string, unknown>) => d.documentType === documentType);
      if (!docGroup) {
        docGroup = { documentType, files: [] };
        arr.push(docGroup);
      }
      (docGroup.files as any[]).push({ url, fileName: originalFileName });
    };

    // Proposer Documents
    for (const { field, documentType } of proposerDocTypes) {
      const file = formData.get(field) as File;
      if (file) {
        await addFileToDocArray(proposerDocuments, documentType, file, id, 'docs');
      }
    }
    // LA Documents
    for (const { field, documentType } of laDocTypes) {
      const file = formData.get(field) as File;
      if (file) {
        await addFileToDocArray(laDocuments, documentType, file, id, 'docs');
      }
    }

    // Payment and verification docs can be handled in their own endpoints, but you can add logic here if needed

    // Collect other fields
    const verificationData: Record<string, unknown> = {
      leadId: id,
      status: 'submitted',
      insuranceType: 'life_insurance',
      documents: {
        proposerDocuments,
        laDocuments,
      },
      paymentDocuments,
      verificationDocuments,
    };

    // Add all other non-file fields
    for (const [key, value] of formData.entries()) {
      if (
        !proposerDocTypes.some((d) => d.field === key) &&
        !laDocTypes.some((d) => d.field === key)
      ) {
        verificationData[key] = value;
      }
    }

    // Create verification record
    const verification = await (LifeInsuranceVerification as any).create(verificationData);

    return NextResponse.json({ success: true, data: verification });
  } catch (error) {
    console.error('Error in life insurance verification:', error);
    return NextResponse.json(
      { error: 'Failed to process verification' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;

    const verification = await (LifeInsuranceVerification as any).findOne({ leadId: id });
    if (!verification) {
      return NextResponse.json(
        { error: 'Verification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: verification });
  } catch (error) {
    console.error('Error fetching life insurance verification:', error);
    return NextResponse.json(
      { error: 'Failed to fetch verification' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const updateData = await req.json();

    // No file upload handling for JSON body
    // Directly update the document with the received JSON
    const verification = await (LifeInsuranceVerification as any).findOneAndUpdate(
      { leadId: id },
      { $set: updateData },
      { new: true }
    );

    if (!verification) {
      return NextResponse.json(
        { error: 'Verification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: verification });
  } catch (error) {
    console.error('Error updating life insurance verification:', error);
    return NextResponse.json(
      { error: 'Failed to update verification' },
      { status: 500 }
    );
  }
} 