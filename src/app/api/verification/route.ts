import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import TermInsuranceVerification from '@/models/TermInsuranceVerification';
import HealthInsuranceVerification from '@/models/HealthInsuranceVerification';
import LifeInsuranceVerification from '@/models/LifeInsuranceVerification';
import CarInsuranceVerification from '@/models/CarInsuranceVerification';

export async function GET() {
  try {
    await connectDB();

    // Fetch verification details from all insurance types
    const [termVerifications, healthVerifications, lifeVerifications, carVerifications] = await Promise.all([
      TermInsuranceVerification.find({}).lean(),
      HealthInsuranceVerification.find({}).lean(),
      LifeInsuranceVerification.find({}).lean(),
      CarInsuranceVerification.find({}).lean()
    ]);

    // Combine all verifications into a single array
    const allVerifications = [
      ...termVerifications.map(v => ({ ...v, insuranceType: 'term_insurance' })),
      ...healthVerifications.map(v => ({ ...v, insuranceType: 'health_insurance' })),
      ...lifeVerifications.map(v => ({ ...v, insuranceType: 'life_insurance' })),
      ...carVerifications.map(v => ({ ...v, insuranceType: 'car_insurance' }))
    ];

    return NextResponse.json(allVerifications);
  } catch (error) {
    console.error('Error fetching verification details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch verification details' },
      { status: 500 }
    );
  }
} 