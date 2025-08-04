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
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Import Attendance model dynamically to avoid TypeScript issues
    const { default: Attendance } = await import('@/models/Attendance');
    
    const attendance = await Attendance.findOne({
      userId,
      date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      }
    });

    return NextResponse.json({ attendance });
  } catch (error) {
    console.error('Error fetching today\'s attendance:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 