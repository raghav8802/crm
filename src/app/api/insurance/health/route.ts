import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import HealthInsurance from '@/models/HealthInsuranceVerification';

export async function GET() {
  try {
    await connectDB();

    const applications = await (HealthInsurance as any).find()
      .select('leadId status')
      .populate('leadId', 'name phoneNumber email')
      .sort({ createdAt: -1 });

    return NextResponse.json(applications);
  } catch (error) {
    console.error('Error fetching health insurance applications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch health insurance applications' },
      { status: 500 }
    );
  }
} 