import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    // Get user from token
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    const userId = decoded.userId;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '30');
    const page = parseInt(searchParams.get('page') || '1');

    // Import Attendance model dynamically
    const { default: Attendance } = await import('@/models/Attendance');

    const records = await Attendance.find({ userId })
      .sort({ date: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await Attendance.countDocuments({ userId });

    return NextResponse.json({ 
      records,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching attendance history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 