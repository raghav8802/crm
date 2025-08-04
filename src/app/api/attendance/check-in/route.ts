import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import  connectToDatabase  from '@/lib/db';

// Import the Attendance model
const Attendance = mongoose.models.Attendance || mongoose.model('Attendance', new mongoose.Schema({
  userId: { type: String, required: true },
  date: { type: String, required: true },
  checkIn: { type: String, required: true },
  checkOut: { type: String },
  totalHours: { type: Number },
  status: { type: String, enum: ['present', 'absent', 'late'], default: 'present' },
  checkInPhoto: { type: String },
  checkOutPhoto: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true })) as any;

export async function POST(request: NextRequest) {
  try {
    console.log('Check-in API called');
    await connectToDatabase();

    // Get token from cookies
    const token = request.cookies.get('token')?.value;
    if (!token) {
      console.log('No token provided');
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    const userId = decoded.userId;
    console.log('User ID:', userId);

    // Get request body
    const body = await request.json();
    const { photo } = body;
    console.log('Photo received, size:', photo ? photo.length : 0);

    if (!photo) {
      console.log('No photo provided');
      return NextResponse.json({ error: 'Photo is required' }, { status: 400 });
    }

    // Check if attendance already exists for today
    const today = new Date().toISOString().split('T')[0];
    console.log('Checking for existing attendance on:', today);
    const existingAttendance = await Attendance.findOne({ userId, date: today });

    if (existingAttendance) {
      console.log('Attendance already exists for today');
      return NextResponse.json({ error: 'Attendance already recorded for today' }, { status: 400 });
    }

    // Determine status based on time (9:30 AM cutoff)
    const now = new Date();
    const cutoffTime = new Date();
    cutoffTime.setHours(9, 30, 0, 0);
    
    const status = now > cutoffTime ? 'late' : 'present';
    const checkInTime = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    console.log('Creating attendance record:', { userId, date: today, checkIn: checkInTime, status });

    // Create new attendance record
    const attendance = new Attendance({
      userId,
      date: today,
      checkIn: checkInTime,
      status,
      checkInPhoto: photo
    });

    await attendance.save();
    console.log('Attendance saved successfully');

    return NextResponse.json({ 
      message: 'Check-in successful',
      attendance: {
        _id: attendance._id,
        userId: attendance.userId,
        date: attendance.date,
        checkIn: attendance.checkIn,
        checkOut: attendance.checkOut,
        totalHours: attendance.totalHours,
        status: attendance.status,
        createdAt: attendance.createdAt
      }
    });

  } catch (error) {
    console.error('Check-in error:', error);
    return NextResponse.json({ error: 'Failed to check in' }, { status: 500 });
  }
} 