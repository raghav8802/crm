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
    
    // Get today's date in YYYY-MM-DD format to match our attendance records
    const today = new Date().toISOString().split('T')[0];
    console.log('Looking for attendance on date:', today);

    // Import Attendance model dynamically to avoid TypeScript issues
    const { default: Attendance } = await import('@/models/Attendance');
    
    const attendance = await Attendance.findOne({
      userId,
      date: today
    });

    console.log('Found attendance:', attendance);
    return NextResponse.json({ attendance });
  } catch (error) {
    console.error('Error fetching today\'s attendance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 