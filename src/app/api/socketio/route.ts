import { NextRequest, NextResponse } from 'next/server';
import { initSocket } from '@/lib/socket';

export async function GET(req: NextRequest) {
  // This is just to initialize the socket server
  // The actual WebSocket connection will be handled by Socket.IO
  return NextResponse.json({ message: 'Socket.IO server is running' });
}

export async function POST(req: NextRequest) {
  // This is just to initialize the socket server
  // The actual WebSocket connection will be handled by Socket.IO
  return NextResponse.json({ message: 'Socket.IO server is running' });
} 