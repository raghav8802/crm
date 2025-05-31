import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import LifeInsuranceVerification from '@/models/LifeInsuranceVerification';
import { uploadFile } from '@/utils/fileUpload';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const leadId = params.id;
    const formData = await req.formData();

    // Handle file uploads
    const fileFields = [
      'proposerPanPhoto',
      'proposerAadharPhoto',
      'proposerPhoto',
      'proposerCancelledCheque',
      'proposerBankStatement',
      'proposerOtherDocument',
      'laPanPhoto',
      'laAadharPhoto',
      'laPhoto',
      'laCancelledCheque',
      'laBankStatement',
      'laOtherDocument'
    ];

    const verificationData: Record<string, any> = {
      leadId,
      status: 'submitted',
      insuranceType: 'life_insurance'
    };

    // Process file uploads
    for (const field of fileFields) {
      const file = formData.get(field) as File;
      if (file) {
        const filePath = await uploadFile(file, leadId, 'life-insurance');
        verificationData[field] = filePath;
      }
    }

    // Process other form fields
    for (const [key, value] of formData.entries()) {
      if (!fileFields.includes(key)) {
        verificationData[key] = value;
      }
    }

    // Create verification record
    const verification = await LifeInsuranceVerification.create(verificationData);

    return NextResponse.json({ success: true, data: verification });
  } catch (error) {
    console.error('Error in life insurance verification:', error);
    return NextResponse.json(
      { error: 'Failed to process verification' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const leadId = params.id;

    const verification = await LifeInsuranceVerification.findOne({ leadId });
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

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const leadId = params.id;
    const formData = await req.formData();

    // Handle file uploads
    const fileFields = [
      'proposerPanPhoto',
      'proposerAadharPhoto',
      'proposerPhoto',
      'proposerCancelledCheque',
      'proposerBankStatement',
      'proposerOtherDocument',
      'laPanPhoto',
      'laAadharPhoto',
      'laPhoto',
      'laCancelledCheque',
      'laBankStatement',
      'laOtherDocument'
    ];

    const updateData: Record<string, any> = {};

    // Process file uploads
    for (const field of fileFields) {
      const file = formData.get(field) as File;
      if (file) {
        const filePath = await uploadFile(file, leadId, 'life-insurance');
        updateData[field] = filePath;
      }
    }

    // Process other form fields
    for (const [key, value] of formData.entries()) {
      if (!fileFields.includes(key)) {
        updateData[key] = value;
      }
    }

    const verification = await LifeInsuranceVerification.findOneAndUpdate(
      { leadId },
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