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
    console.log('Check-out API called');
    await connectToDatabase();

    // Get token from cookies
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
    const userId = decoded.userId;

    // Get user details for folder structure
    const user = await User.findById(userId);
    if (!user) {
      console.log('User not found');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get request body
    const body = await request.json();
    const { photo } = body;

    // Find today's attendance record
    const today = new Date().toISOString().split('T')[0];
    const attendance = await Attendance.findOne({ userId, date: today });

    if (!attendance) {
      return NextResponse.json({ error: 'No check-in record found for today' }, { status: 400 });
    }

    if (attendance.checkOut) {
      return NextResponse.json({ error: 'Already checked out today' }, { status: 400 });
    }

    // Calculate check-out time and total hours
    const now = new Date();
    const checkOutTime = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    // Parse check-in time to calculate total hours
    const checkInTime = attendance.checkIn;
    const [checkInHour, checkInMinute] = checkInTime.split(':').map(Number);
    const checkInDate = new Date();
    checkInDate.setHours(checkInHour, checkInMinute, 0, 0);

    const totalHours = (now.getTime() - checkInDate.getTime()) / (1000 * 60 * 60);

    let photoUrl = null;
    let photoUploadError = null;

    // Try to upload photo if provided
    if (photo) {
      try {
        console.log('Uploading check-out photo to S3...');
        const uploadResult = await uploadAttendancePhotoToS3(
          photo,
          userId,
          user.name,
          'check-out'
        );
        console.log('Check-out photo uploaded to S3:', uploadResult.url);
        photoUrl = uploadResult.url;
      } catch (uploadError) {
        console.error('Check-out photo upload failed:', uploadError);
        photoUploadError = 'Photo upload failed, but check-out recorded';
      }
    } else {
      photoUploadError = 'No photo provided, but check-out recorded';
    }

    // Update attendance record
    attendance.checkOut = checkOutTime;
    attendance.totalHours = Math.round(totalHours * 100) / 100; // Round to 2 decimal places
    attendance.checkOutPhoto = photoUrl;
    attendance.updatedAt = new Date();

    console.log('Updating attendance record with:', {
      checkOut: attendance.checkOut,
      totalHours: attendance.totalHours,
      checkOutPhoto: attendance.checkOutPhoto
    });

    await attendance.save();
    console.log('Check-out attendance updated successfully');
    console.log('Final attendance record:', attendance);

    return NextResponse.json({ 
      message: photoUploadError ? 'Check-out successful (photo upload failed)' : 'Check-out successful',
      attendance: {
        _id: attendance._id,
        userId: attendance.userId,
        date: attendance.date,
        checkIn: attendance.checkIn,
        checkOut: attendance.checkOut,
        totalHours: attendance.totalHours,
        status: attendance.status,
        checkInPhoto: attendance.checkInPhoto,
        checkOutPhoto: attendance.checkOutPhoto,
        createdAt: attendance.createdAt
      },
      photoUploadError
    });

  } catch (error) {
    console.error('Check-out error:', error);
    return NextResponse.json({ error: 'Failed to check out' }, { status: 500 });
  }
} 