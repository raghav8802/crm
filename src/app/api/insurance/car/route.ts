import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import CarInsurance from '@/models/CarInsurance';

export async function GET() {
  try {
    await connectDB();

    const applications = await CarInsurance.find()
      .select('leadId status')
      .populate('leadId', 'name phoneNumber email')
      .sort({ createdAt: -1 });

    return NextResponse.json(applications);
  } catch (error) {
    console.error('Error fetching car insurance applications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch car insurance applications' },
      { status: 500 }
    );
  }
} 