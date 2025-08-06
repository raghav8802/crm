import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import connectToDatabase from '@/lib/db';
import { uploadAttendancePhotoToS3 } from '@/utils/s3Upload';

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

// Import User model to get user name
const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  role: { type: String, required: true },
  phone: { type: String },
  createdAt: { type: Date, default: Date.now }
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

    // Get user details for folder structure
    const user = await User.findById(userId);
    if (!user) {
      console.log('User not found');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

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

    // Upload photo to S3
    console.log('Uploading photo to S3...');
    const uploadResult = await uploadAttendancePhotoToS3(
      photo,
      userId,
      user.name,
      'check-in'
    );
    console.log('Photo uploaded to S3:', uploadResult.url);

    // Determine status based on time (10:00 AM cutoff)
    const now = new Date();
    const cutoffTime = new Date();
    cutoffTime.setHours(10, 0, 0, 0); // 10:00 AM cutoff
    
    const status = now > cutoffTime ? 'late' : 'present';
    const checkInTime = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    console.log('Creating attendance record:', { 
      userId, 
      date: today, 
      checkIn: checkInTime, 
      status,
      photoUrl: uploadResult.url 
    });

    // Create new attendance record
    const attendance = new Attendance({
      userId,
      date: today,
      checkIn: checkInTime,
      status,
      checkInPhoto: uploadResult.url
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
        checkInPhoto: attendance.checkInPhoto,
        createdAt: attendance.createdAt
      }
    });

  } catch (error) {
    console.error('Check-in error:', error);
    return NextResponse.json({ error: 'Failed to check in' }, { status: 500 });
  }
} 