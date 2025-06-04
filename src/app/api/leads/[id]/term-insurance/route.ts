import { NextRequest, NextResponse } from 'next/server';
import  connectDB  from '@/lib/db';
import TermInsuranceVerification from '@/models/TermInsuranceVerification';
import { uploadFile } from '@/utils/fileUpload';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const formData = await request.formData();
    const leadId = params.id;

    // Handle file uploads
    const fileFields = [
      'panPhoto',
      'aadharPhoto',
      'userPhoto',
      'cancelledCheque',
      'bankStatement',
      'otherDocument'
    ];

    const uploadedFiles: { [key: string]: string } = {};

    for (const field of fileFields) {
      const file = formData.get(field) as File;
      if (file) {
        const filePath = await uploadFile(file, leadId, field);
        uploadedFiles[field] = filePath;
      }
    }

    // Build verificationData, skipping file fields
    const verificationData: Record<string, any> = {
      leadId,
      status: 'submitted',
      insuranceType: 'term_insurance',
      ...uploadedFiles
    };

    for (const [key, value] of formData.entries()) {
      if (!fileFields.includes(key)) {
        verificationData[key] = value;
      }
    }

    // Create new verification record
    const verification = await TermInsuranceVerification.create(verificationData);

    return NextResponse.json({
      success: true,
      data: verification
    });

  } catch (error) {
    console.error('Error in term insurance verification:', error);
    return NextResponse.json(
      { error: 'Failed to process term insurance verification' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const verification = await TermInsuranceVerification.findOne({
      leadId: params.id
    });

    if (!verification) {
      return NextResponse.json(
        { error: 'Term insurance verification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: verification
    });

  } catch (error) {
    console.error('Error fetching term insurance verification:', error);
    return NextResponse.json(
      { error: 'Failed to fetch term insurance verification' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const leadId = params.id;
    const updateData = await request.json();

    let updateOps: any = {};
    if (updateData.newRemark) {
      // Convert timestamp string to Date object
      const remark = {
        ...updateData.newRemark,
        timestamp: new Date(updateData.newRemark.timestamp)
      };
      updateOps.$push = { remarks: remark };
    }
    const fieldsToUpdate = { ...updateData };
    delete fieldsToUpdate.newRemark;
    delete fieldsToUpdate.remarks;
    if (Object.keys(fieldsToUpdate).length > 0) {
      updateOps.$set = fieldsToUpdate;
    }

    const verification = await TermInsuranceVerification.findOneAndUpdate(
      { leadId },
      updateOps,
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
    console.error('Error updating term insurance verification:', error);
    return NextResponse.json(
      { error: 'Failed to update verification' },
      { status: 500 }
    );
  }
} 