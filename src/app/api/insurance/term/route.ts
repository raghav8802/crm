import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { TermInsurance } from '@/models/TermInsuranceVerification';

export async function GET() {
  try {
    await connectDB();

    const applications = await TermInsurance.find()
      .select('leadId status')
      .populate('leadId', 'name phoneNumber email')
      .sort({ createdAt: -1 });

    return NextResponse.json(applications);
  } catch (error) {
    console.error('Error fetching term insurance applications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch term insurance applications' },
      { status: 500 }
    );
  }
} 