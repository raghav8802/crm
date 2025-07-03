'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Video, User, Mic, MicOff, VideoOff, Phone, PhoneOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { io, Socket } from 'socket.io-client';
import Peer from 'simple-peer';

interface VideoCallProps {
  callId: string;
  userName: string;
}

function VideoCallInterface({ callId, userName }: VideoCallProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [peers, setPeers] = useState<Map<string, Peer.Instance>>(new Map());
  const [participants, setParticipants] = useState<Array<{ userId: string; userName: string }>>([]);
  
  const socketRef = useRef<Socket | null>(null);
  const peersRef = useRef<Map<string, Peer.Instance>>(new Map());
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    // Initialize video call with WebRTC
    const initializeCall = async () => {
      try {
        // Get user media
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        setLocalStream(stream);
        
        // Connect to Socket.IO server
        const socket = io({
          path: '/api/socketio',
          transports: ['websocket', 'polling'],
          timeout: 20000,
        });
        socketRef.current = socket;
        
        // Add connection event listeners
        socket.on('connect', () => {
          console.log('Connected to Socket.IO server');
        });
        
        socket.on('connect_error', (error) => {
          console.error('Socket.IO connection error:', error);
          toast({
            title: "Connection Error",
            description: "Failed to connect to video call server. Please try again.",
            variant: "destructive",
          });
        });
        
        // Join the room
        socket.emit('join-room', callId, userName);
        
        // Handle user joined
        socket.on('user-joined', ({ userId, userName: newUserName }: { userId: string; userName: string }) => {
          console.log('User joined:', newUserName);
          setParticipants(prev => [...prev, { userId, userName: newUserName }]);
          
          // Create peer connection
          const peer = new Peer({
            initiator: true,
            trickle: false,
            stream: stream,
            config: {
              iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
              ]
            }
          });
          
          peer.on('error', (err) => {
            console.error('Peer connection error:', err);
            toast({
              title: "Connection Error",
              description: "Failed to establish video connection.",
              variant: "destructive",
            });
          });
          
          peer.on('signal', (data) => {
            socket.emit('offer', { roomId: callId, offer: data });
          });
          
          peer.on('stream', (remoteStream) => {
            setRemoteStream(remoteStream);
          });
          
          peersRef.current.set(userId, peer);
          setPeers(prev => new Map(prev).set(userId, peer));
        });
        
        // Handle existing users
        socket.on('room-users', (users: Array<{ userId: string; userName: string }>) => {
          setParticipants(users);
          users.forEach(({ userId }: { userId: string }) => {
            const peer = new Peer({
              initiator: false,
              trickle: false,
              stream: stream,
              config: {
                iceServers: [
                  { urls: 'stun:stun.l.google.com:19302' },
                  { urls: 'stun:stun1.l.google.com:19302' },
                ]
              }
            });
            
            peer.on('error', (err) => {
              console.error('Peer connection error:', err);
              toast({
                title: "Connection Error",
                description: "Failed to establish video connection.",
                variant: "destructive",
              });
            });
            
            peer.on('signal', (data) => {
              socket.emit('answer', { roomId: callId, answer: data });
            });
            
            peer.on('stream', (remoteStream) => {
              setRemoteStream(remoteStream);
            });
            
            peersRef.current.set(userId, peer);
            setPeers(prev => new Map(prev).set(userId, peer));
          });
        });
        
        // Handle offers
        socket.on('offer', ({ offer, from }: { offer: any; from: string }) => {
          const peer = peersRef.current.get(from);
          if (peer) {
            peer.signal(offer);
          }
        });
        
        // Handle answers
        socket.on('answer', ({ answer, from }: { answer: any; from: string }) => {
          const peer = peersRef.current.get(from);
          if (peer) {
            peer.signal(answer);
          }
        });
        
        // Handle ICE candidates
        socket.on('ice-candidate', ({ candidate, from }: { candidate: any; from: string }) => {
          const peer = peersRef.current.get(from);
          if (peer) {
            peer.signal(candidate);
          }
        });
        
        // Handle user left
        socket.on('user-left', ({ userId }: { userId: string }) => {
          const peer = peersRef.current.get(userId);
          if (peer) {
            peer.destroy();
            peersRef.current.delete(userId);
            setPeers(prev => {
              const newPeers = new Map(prev);
              newPeers.delete(userId);
              return newPeers;
            });
          }
          setParticipants(prev => prev.filter(p => p.userId !== userId));
        });
        
        setIsConnected(true);
        
        toast({
          title: "Connected to video call",
          description: "You are now connected to the video call.",
        });
      } catch (error) {
        console.error('Error accessing media devices:', error);
        toast({
          title: "Error",
          description: "Could not access camera and microphone. Please check permissions.",
          variant: "destructive",
        });
      }
    };

    initializeCall();

    return () => {
      // Cleanup
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      
      peersRef.current.forEach(peer => {
        peer.destroy();
      });
    };
  }, [callId, userName]);

  // Update video elements when streams change
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const endCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    
    peersRef.current.forEach(peer => {
      peer.destroy();
    });
    
    setIsConnected(false);
    setLocalStream(null);
    setRemoteStream(null);
    setPeers(new Map());
    setParticipants([]);
    
    toast({
      title: "Call ended",
      description: "You have left the video call.",
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Video Call</h1>
            <p className="text-gray-400">Call ID: {callId}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Connected as:</span>
            <span className="font-medium">{userName}</span>
          </div>
        </div>

        {/* Video Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Local Video */}
          <div className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video">
            {localStream ? (
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Video className="h-12 w-12 mx-auto mb-2 text-gray-500" />
                  <p className="text-gray-400">Loading camera...</p>
                </div>
              </div>
            )}
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 px-3 py-1 rounded-full">
              <span className="text-sm">You ({userName})</span>
            </div>
            {isVideoOff && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <div className="text-center">
                  <VideoOff className="h-16 w-16 mx-auto mb-2 text-gray-500" />
                  <p className="text-gray-400">Camera is off</p>
                </div>
              </div>
            )}
          </div>

          {/* Remote Video */}
          <div className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video">
            {remoteStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <User className="h-12 w-12 mx-auto mb-2 text-gray-500" />
                  <p className="text-gray-400">Waiting for other participant...</p>
                </div>
              </div>
            )}
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 px-3 py-1 rounded-full">
              <span className="text-sm">Other Participant</span>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <Button
            onClick={toggleMute}
            variant={isMuted ? "destructive" : "outline"}
            size="lg"
            className="rounded-full w-14 h-14"
          >
            {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          </Button>

          <Button
            onClick={toggleVideo}
            variant={isVideoOff ? "destructive" : "outline"}
            size="lg"
            className="rounded-full w-14 h-14"
          >
            {isVideoOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
          </Button>

          <Button
            onClick={endCall}
            variant="destructive"
            size="lg"
            className="rounded-full w-14 h-14"
          >
            <PhoneOff className="h-6 w-6" />
          </Button>
        </div>

        {/* Status */}
        <div className="text-center mt-4">
          <div className="inline-flex items-center gap-2 bg-gray-800 px-4 py-2 rounded-full">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function JoinForm({ callId, onJoin }: { callId: string; onJoin: (userName: string) => void }) {
  const [userName, setUserName] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const { toast } = useToast();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter your name to join the call.",
        variant: "destructive",
      });
      return;
    }

    setIsJoining(true);
    onJoin(userName.trim());
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
            <Video className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-2xl">Join Video Call</CardTitle>
          <CardDescription>
            Enter your name to join the video call session
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <label htmlFor="userName" className="block text-sm font-medium mb-2">
                Your Name
              </label>
              <Input
                id="userName"
                type="text"
                placeholder="Enter your full name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={isJoining}
            >
              {isJoining ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Joining...
                </>
              ) : (
                <>
                  <Phone className="h-4 w-4 mr-2" />
                  Join Call
                </>
              )}
            </Button>
          </form>
          
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Call Information</h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Call ID: <span className="font-mono">{callId}</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function VideoCallPage() {
  const params = useParams();
  const callId = params.callId as string;
  const [userName, setUserName] = useState<string | null>(null);

  const handleJoin = (name: string) => {
    setUserName(name);
  };

  if (!userName) {
    return <JoinForm callId={callId} onJoin={handleJoin} />;
  }

  return <VideoCallInterface callId={callId} userName={userName} />;
} 