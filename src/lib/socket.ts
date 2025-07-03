import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { NextApiRequest, NextApiResponse } from 'next';

export type NextApiResponseServerIO = NextApiResponse & {
  socket: {
    server: NetServer & {
      io: SocketIOServer;
    };
  };
};

export const config = {
  api: {
    bodyParser: false,
  },
};

export const initSocket = (req: NextApiRequest, res: NextApiResponseServerIO) => {
  if (!res.socket.server.io) {
    const io = new SocketIOServer(res.socket.server, {
      path: '/api/socketio',
      addTrailingSlash: false,
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? process.env.NEXT_PUBLIC_APP_URL 
          : 'http://localhost:3000',
        methods: ['GET', 'POST'],
      },
    });

    // Store active rooms and their participants
    const rooms = new Map<string, Set<string>>();

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      // Join a video call room
      socket.on('join-room', (roomId: string, userName: string) => {
        socket.join(roomId);
        
        // Add user to room tracking
        if (!rooms.has(roomId)) {
          rooms.set(roomId, new Set());
        }
        rooms.get(roomId)!.add(socket.id);
        
        // Store user info
        socket.data.roomId = roomId;
        socket.data.userName = userName;
        
        console.log(`User ${userName} joined room ${roomId}`);
        
        // Notify other users in the room
        socket.to(roomId).emit('user-joined', {
          userId: socket.id,
          userName: userName,
        });
        
        // Send list of existing users to the new user
        const roomUsers = Array.from(rooms.get(roomId) || [])
          .filter(id => id !== socket.id)
          .map(id => ({
            userId: id,
            userName: 'Unknown', // We'll need to store this in a more robust way
          }));
        
        socket.emit('room-users', roomUsers);
      });

      // Handle WebRTC signaling
      socket.on('offer', (data) => {
        socket.to(data.roomId).emit('offer', {
          offer: data.offer,
          from: socket.id,
        });
      });

      socket.on('answer', (data) => {
        socket.to(data.roomId).emit('answer', {
          answer: data.answer,
          from: socket.id,
        });
      });

      socket.on('ice-candidate', (data) => {
        socket.to(data.roomId).emit('ice-candidate', {
          candidate: data.candidate,
          from: socket.id,
        });
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        const roomId = socket.data.roomId;
        if (roomId && rooms.has(roomId)) {
          rooms.get(roomId)!.delete(socket.id);
          
          // Remove room if empty
          if (rooms.get(roomId)!.size === 0) {
            rooms.delete(roomId);
          } else {
            // Notify other users
            socket.to(roomId).emit('user-left', {
              userId: socket.id,
              userName: socket.data.userName,
            });
          }
        }
        
        console.log('Client disconnected:', socket.id);
      });
    });

    res.socket.server.io = io;
  }
  
  return res.socket.server.io;
}; 