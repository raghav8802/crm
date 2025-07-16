import { NextResponse } from 'next/server';

export async function GET() {
  // This is just to initialize the socket server
  // The actual WebSocket connection will be handled by Socket.IO
  return NextResponse.json({ message: 'Socket.IO server is running' });
}

export async function POST() {
  // This is just to initialize the socket server
  // The actual WebSocket connection will be handled by Socket.IO
  return NextResponse.json({ message: 'Socket.IO server is running' });
} 