import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Lead } from '@/models/Lead';
import { LeadThread } from '@/models/LeadThread';

export async function POST(request: Request) {
  try {
    const db = await connectDB();
    const body = await request.json();

    // Create a new lead
    const lead = new Lead({
      name: body.name,
      email: body.email,
      phoneNumber: body.phoneNumber,
      altNumber: body.altNumber || '',
      gender: body.gender || 'Other',
      dateOfBirth: body.dateOfBirth || '',
      age: body.age || '',
      tabacoUser: body.tabacoUser || 'no',
      annualIncome: body.annualIncome || '',
      occupation: body.occupation || '',
      education: body.education || '12th',
      address: body.address || '',
      status: body.status || 'Fresh',
      notes: [],
      assignedTo: body.assignedTo || '',
      assignedFrom: body.assignedFrom || ''
    });

    await lead.save();

    // Create initial thread entry
    const threadEntry = new LeadThread({
      leadId: lead._id,
      action: 'Lead Created',
      details: 'Lead was created with initial details',
      performedBy: 'System'
    });

    await threadEntry.save();

    return NextResponse.json(lead, { status: 201 });
  } catch (error) {
    console.error('Error creating lead:', error);
    return NextResponse.json(
      { error: 'Failed to create lead' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const db = await connectDB();
    const leads = await Lead.find().sort({ createdAt: -1 });
    return NextResponse.json(leads);
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
      { status: 500 }
    );
  }
} 