import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import TermInsuranceVerification from '@/models/TermInsuranceVerification';
import HealthInsuranceVerification from '@/models/HealthInsuranceVerification';
import CarInsuranceVerification from '@/models/CarInsuranceVerification';
import LifeInsuranceVerification from '@/models/LifeInsuranceVerification';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;

    // Try to find verification in each insurance type
    const [termVerification, healthVerification, carVerification, lifeVerification] = await Promise.all([
      (TermInsuranceVerification as any).findOne({ leadId: id }),
      (HealthInsuranceVerification as any).findOne({ leadId: id }),
      (CarInsuranceVerification as any).findOne({ leadId: id }),
      (LifeInsuranceVerification as any).findOne({ leadId: id })
    ]);

    // Return the first verification found
    const verification = termVerification || healthVerification || carVerification || lifeVerification;

    if (!verification) {
      return NextResponse.json(
        { error: 'Verification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(verification);
  } catch (error) {
    console.error('Error fetching verification details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch verification details' },
      { status: 500 }
    );
  }
} 