import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Lead } from '@/models/Lead';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    if (!status) {
      return NextResponse.json(
        { error: 'Status parameter is required' },
        { status: 400 }
      );
    }

    const count = await Lead.countDocuments({ status });
    return NextResponse.json({ count });
  } catch (error) {
    console.error('Error counting leads:', error);
    return NextResponse.json(
      { error: 'Failed to count leads' },
      { status: 500 }
    );
  }
} 