import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import CarInsuranceVerification from '@/models/CarInsuranceVerification';
import { uploadFileToS3 } from '@/utils/s3Upload';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const formData = await req.formData();

    // Handle file uploads
    const fileFields = [
      'panCard',
      'aadharCard',
      'rcCopy',
      'policyCopy'
    ];

    const verificationData: Record<string, string | boolean> = {
      leadId: id,
      status: 'submitted',
      insuranceType: 'car_insurance'
    };

    // Process file uploads
    for (const field of fileFields) {
      const file = formData.get(field) as File;
      if (file) {
        const { url } = await uploadFileToS3(file, id, 'docs', 'car-insurance');
        verificationData[field] = url;
      }
    }

    // Process other form fields
    for (const [key, value] of formData.entries()) {
      if (!fileFields.includes(key)) {
        // Convert boolean string to actual boolean for isBharatSeries
        if (key === 'isBharatSeries') {
          verificationData[key] = value === 'true';
        } else {
          verificationData[key] = value as string;
        }
      }
    }

    // Create verification record
    const verification = await (CarInsuranceVerification as any).create(verificationData);

    return NextResponse.json({ success: true, data: verification });
  } catch (error) {
    console.error('Error in car insurance verification:', error);
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

    const verification = await (CarInsuranceVerification as any).findOne({ leadId: id });
    if (!verification) {
      return NextResponse.json(
        { error: 'Verification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: verification });
  } catch (error) {
    console.error('Error fetching car insurance verification:', error);
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

    const updateOps: Record<string, unknown> = {};
    // If newRemark is present, use $push for remarks
    if (updateData.newRemark) {
      updateOps.$push = { remarks: updateData.newRemark };
    }
    // Remove newRemark and remarks from updateData to avoid conflict
    const fieldsToUpdate = { ...updateData };
    delete fieldsToUpdate.newRemark;
    delete fieldsToUpdate.remarks;
    if (Object.keys(fieldsToUpdate).length > 0) {
      updateOps.$set = fieldsToUpdate;
    }

    const verification = await (CarInsuranceVerification as any).findOneAndUpdate(
      { leadId: id },
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
    console.error('Error updating car insurance verification:', error);
    return NextResponse.json(
      { error: 'Failed to update verification' },
      { status: 500 }
    );
  }
} 