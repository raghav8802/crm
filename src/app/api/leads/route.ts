import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Lead } from '@/models/Lead';
import mongoose from 'mongoose';

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.json();

    // Convert assignedTo and assignedFrom to ObjectId if present
    const assignedTo = body.assignedTo ? new mongoose.Types.ObjectId(body.assignedTo) : undefined;
    const assignedFrom = body.assignedFrom ? new mongoose.Types.ObjectId(body.assignedFrom) : undefined;

    const lead = new Lead({
      name: body.name,
      email: body.email,
      phoneNumber: body.phoneNumber,
      altNumber: body.altNumber,
      gender: body.gender,
      dateOfBirth: body.dateOfBirth,
      age: body.age,
      tabacoUser: body.tabacoUser,
      annualIncome: body.annualIncome,
      occupation: body.occupation,
      education: body.education,
      address: body.address,
      status: body.status || 'Fresh',
      notes: [],
      assignedTo,
      assignedFrom,
      source: body.source,
      thread: [{
        action: 'Lead Created',
        details: 'Lead was created with initial details',
        performedBy: 'System',
        timestamp: new Date()
      }]
    });

    console.log('Lead to be saved:', lead);

    await lead.save();

    return NextResponse.json(lead, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating lead:', error);
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create lead' },
      { status: 500 }
    );
  }
}

interface LeadQuery {
  status?: string;
}

export async function GET(req: Request) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    
    const query: LeadQuery = {};
    if (status) {
      query.status = status;
    }
    
    const leads = await Lead.find(query).sort({ createdAt: -1 });
    return NextResponse.json(leads);
  } catch (error) {
    console.error('Error fetching leads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
      { status: 500 }
    );
  }
} 