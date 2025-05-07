import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Reminder } from '@/models/Reminder';

// Get all pending reminders
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';

    const reminders = await Reminder.find({ status })
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
    const { leadId, scheduledTime } = body;

    if (!leadId || !scheduledTime) {
      return NextResponse.json(
        { error: 'Lead ID and scheduled time are required' },
        { status: 400 }
      );
    }

    const reminder = await Reminder.create({
      leadId,
      scheduledTime: new Date(scheduledTime),
      status: 'pending',
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
    const { reminderId, status } = body;

    if (!reminderId || !status) {
      return NextResponse.json(
        { error: 'Reminder ID and status are required' },
        { status: 400 }
      );
    }

    const reminder = await Reminder.findByIdAndUpdate(
      reminderId,
      { status },
      { new: true }
    );

    if (!reminder) {
      return NextResponse.json(
        { error: 'Reminder not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(reminder);
  } catch (error) {
    console.error('Error updating reminder:', error);
    return NextResponse.json(
      { error: 'Failed to update reminder' },
      { status: 500 }
    );
  }
} 