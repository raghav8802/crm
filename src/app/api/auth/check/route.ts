import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/db';
import { User } from '@/models/User';

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
      console.log('No token found');
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const decoded = jwt.verify(token.value, process.env.JWT_SECRET!) as JwtPayload;
    console.log('Token verified:', decoded);

    // Connect to database
    await connectDB();

    // Fetch user details from database
    const user = await User.findById(decoded.userId);
    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({ 
      authenticated: true, 
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Auth check failed:', error);
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
} 