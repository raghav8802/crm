import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Lead } from '@/models/Lead';

export async function GET() {
  try {
    await connectDB();
    const recentLeads = await Lead.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name phoneNumber status assignedTo createdAt');
    
    return NextResponse.json(recentLeads);
  } catch (error) {
    console.error('Error fetching recent leads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent leads' },
      { status: 500 }
    );
  }
} 