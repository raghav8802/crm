import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import TermInsuranceVerification from '@/models/TermInsuranceVerification';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const data = await request.json();
    const { id } = await params;

    // Create a new verification record with the structured data
    const verificationData = {
      leadId: id,
      status: 'submitted',
      insuranceType: 'term_insurance',
      ...data,
    };

    const verification = await (TermInsuranceVerification as any).create(verificationData);

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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;
    const verification = await (TermInsuranceVerification as any).findOne({
      leadId: id
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const updateData = await request.json();

    const updateOps: Record<string, unknown> = {};
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

    const verification = await (TermInsuranceVerification as any).findOneAndUpdate(
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
    console.error('Error updating term insurance verification:', error);
    return NextResponse.json(
      { error: 'Failed to update verification' },
      { status: 500 }
    );
  }
} 