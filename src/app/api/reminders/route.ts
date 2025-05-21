import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Reminder } from '@/models/Reminder';
import mongoose from 'mongoose';

// Get all pending reminders for the current user
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const reminders = await Reminder.find({ 
      status,
      createdBy: new mongoose.Types.ObjectId(userId)
    })
      .populate('leadId', 'name phoneNumber status')
      .sort({ scheduledTime: 1 });

    return NextResponse.json(reminders);
  } catch (error) {
    console.error('Error fetching reminders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reminders' },
      { status: 500 }
    );
  }
}

// Create a new reminder
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { leadId, scheduledTime, createdBy } = body;

    if (!leadId || !scheduledTime || !createdBy) {
      return NextResponse.json(
        { error: 'Lead ID, scheduled time, and creator ID are required' },
        { status: 400 }
      );
    }

    const reminder = await Reminder.create({
      leadId,
      scheduledTime: new Date(scheduledTime),
      status: 'pending',
      createdBy: new mongoose.Types.ObjectId(createdBy)
    });

    return NextResponse.json(reminder);
  } catch (error) {
    console.error('Error creating reminder:', error);
    return NextResponse.json(
      { error: 'Failed to create reminder' },
      { status: 500 }
    );
  }
}

// Update reminder status
export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    const { reminderId, status, userId } = body;

    if (!reminderId || !status || !userId) {
      return NextResponse.json(
        { error: 'Reminder ID, status, and user ID are required' },
        { status: 400 }
      );
    }

    // Find the reminder and verify it belongs to the user
    const reminder = await Reminder.findOne({
      _id: reminderId,
      createdBy: new mongoose.Types.ObjectId(userId)
    });

    if (!reminder) {
      return NextResponse.json(
        { error: 'Reminder not found or unauthorized' },
        { status: 404 }
      );
    }

    // Update the status
    reminder.status = status;
    await reminder.save();

    return NextResponse.json(reminder);
  } catch (error) {
    console.error('Error updating reminder:', error);
    return NextResponse.json(
      { error: 'Failed to update reminder' },
      { status: 500 }
    );
  }
} 