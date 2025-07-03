const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// Prepare the Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Initialize Socket.IO
  const io = new Server(server, {
    path: '/api/socketio',
    addTrailingSlash: false,
    cors: {
      origin: dev ? 'http://localhost:3000' : process.env.NEXT_PUBLIC_APP_URL,
      methods: ['GET', 'POST'],
    },
  });

  // Store active rooms and their participants
  const rooms = new Map();
  const userInfo = new Map(); // Store user info by socket ID

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Join a video call room
    socket.on('join-room', (roomId, userName) => {
      socket.join(roomId);
      
      // Add user to room tracking
      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Set());
      }
      rooms.get(roomId).add(socket.id);
      
      // Store user info
      userInfo.set(socket.id, { roomId, userName });
      
      console.log(`User ${userName} joined room ${roomId}`);
      
      // Notify other users in the room
      socket.to(roomId).emit('user-joined', {
        userId: socket.id,
        userName: userName,
      });
      
      // Send list of existing users to the new user
      const roomUsers = Array.from(rooms.get(roomId))
        .filter(id => id !== socket.id)
        .map(id => {
          const info = userInfo.get(id);
          return {
            userId: id,
            userName: info ? info.userName : 'Unknown',
          };
        });
      
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
      const userData = userInfo.get(socket.id);
      if (userData) {
        const { roomId, userName } = userData;
        
        if (rooms.has(roomId)) {
          rooms.get(roomId).delete(socket.id);
          
          // Remove room if empty
          if (rooms.get(roomId).size === 0) {
            rooms.delete(roomId);
          } else {
            // Notify other users
            socket.to(roomId).emit('user-left', {
              userId: socket.id,
              userName: userName,
            });
          }
        }
        
        userInfo.delete(socket.id);
      }
      
      console.log('Client disconnected:', socket.id);
    });
  });

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
  });
}); 