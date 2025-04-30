import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Lead } from '@/models/Lead';
import crypto from 'crypto';

// Verify the request is from Facebook
function verifyFacebookRequest(signature: string, payload: string) {
  const expectedSignature = crypto
    .createHmac('sha1', process.env.FACEBOOK_APP_SECRET || '')
    .update(payload)
    .digest('hex');
  
  return signature === expectedSignature;
}

interface LeadField {
  name: string;
  values: string[];
}

interface LeadData {
  entry: Array<{
    changes: Array<{
      value: {
        field_data: LeadField[];
        ad_name?: string;
      };
    }>;
  }>;
}

export async function POST(req: Request) {
  try {
    // Verify the request is from Facebook
    const signature = req.headers.get('x-hub-signature')?.split('=')[1] || '';
    const payload = await req.text();
    
    if (!verifyFacebookRequest(signature, payload)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const leadData = JSON.parse(payload) as LeadData;
    
    // Connect to database
    await connectDB();

    // Extract lead information
    const { field_data } = leadData.entry[0].changes[0].value;
    const leadInfo: Record<string, string> = {};
    
    field_data.forEach((field: LeadField) => {
      leadInfo[field.name] = field.values[0];
    });

    // Create new lead
    const newLead = await Lead.create({
      name: leadInfo.full_name || '',
      email: leadInfo.email || '',
      phoneNumber: leadInfo.phone_number || '',
      status: 'Fresh',
      source: 'Facebook Lead Ad',
      notes: [`Lead generated from Facebook Ad: ${leadData.entry[0].changes[0].value.ad_name || 'Unknown Ad'}`],
      thread: [{
        action: 'Lead Created',
        details: 'Lead generated from Facebook Lead Ad',
        performedBy: 'System',
        timestamp: new Date()
      }]
    });

    return NextResponse.json({ success: true, lead: newLead });
  } catch (error) {
    console.error('Error processing Facebook lead:', error);
    return NextResponse.json(
      { error: 'Failed to process lead' },
      { status: 500 }
    );
  }
} 