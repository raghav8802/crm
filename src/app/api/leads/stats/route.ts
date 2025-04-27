import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Lead } from '@/models/Lead';

export async function GET() {
  try {
    const db = await connectDB();
    
    // Get status distribution
    const statusStats = await Lead.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Get leads by assigned person
    const assignedStats = await Lead.aggregate([
      { $group: { _id: '$assignedTo', count: { $sum: 1 } } }
    ]);

    return NextResponse.json({
      statusStats,
      assignedStats
    });
  } catch (error) {
    console.error('Error fetching lead statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lead statistics' },
      { status: 500 }
    );
  }
} 