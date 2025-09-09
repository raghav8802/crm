import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import TermInsuranceVerification from '@/models/TermInsuranceVerification';
import HealthInsuranceVerification from '@/models/HealthInsuranceVerification';
import LifeInsuranceVerification from '@/models/LifeInsuranceVerification';
import CarInsuranceVerification from '@/models/CarInsuranceVerification';

export async function GET() {
  try {
    await connectDB();

    // Fetch all verifications with PLVC_done status
    const [termVerifications, healthVerifications, lifeVerifications, carVerifications] = await Promise.all([
      (TermInsuranceVerification as any).find({ status: 'PLVC_done' }).populate('leadId').lean(),
      (HealthInsuranceVerification as any).find({ status: 'PLVC_done' }).populate('leadId').lean(),
      (LifeInsuranceVerification as any).find({ status: 'PLVC_done' }).populate('leadId').lean(),
      (CarInsuranceVerification as any).find({ status: 'PLVC_done' }).populate('leadId').lean()
    ]);

    // Combine all verifications into a single array with lead information
    const allRenewals = [
      ...termVerifications.map(v => ({ 
        ...v, 
        insuranceType: 'term_insurance',
        lead: v.leadId,
        leadId: v.leadId._id || v.leadId
      })), //test
      ...healthVerifications.map(v => ({ 
        ...v, 
        insuranceType: 'health_insurance',
        lead: v.leadId,
        leadId: v.leadId._id || v.leadId
      })),
      ...lifeVerifications.map(v => ({ 
        ...v, 
        insuranceType: 'life_insurance',
        lead: v.leadId,
        leadId: v.leadId._id || v.leadId
      })),
      ...carVerifications.map(v => ({ 
        ...v, 
        insuranceType: 'car_insurance',
        lead: v.leadId,
        leadId: v.leadId._id || v.leadId
      }))
    ];

    return NextResponse.json({
      success: true,
      data: allRenewals,
      count: allRenewals.length
    });
  } catch (error) {
    console.error('Error fetching renewal policies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch renewal policies' },
      { status: 500 }
    );
  }
} 