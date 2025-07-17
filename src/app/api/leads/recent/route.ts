import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Lead } from '@/models/Lead';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decoded = jwt.verify(token.value, process.env.JWT_SECRET!) as JwtPayload;
    const userId = decoded.userId;
    const isAdmin = decoded.role === 'admin';

    await connectDB();
    
    // If admin, show last 5 leads from all users, otherwise show last 5 leads of logged-in user
    const query = isAdmin ? {} : { assignedTo: userId };
    
    const recentLeads = await (Lead as any).find(query)
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name phoneNumber status assignedTo createdAt');
    
    return NextResponse.json(recentLeads);
  } catch (error) {
    console.error('Error fetching recent leads:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent leads' },
      { status: 500 }
    );
  }
} 