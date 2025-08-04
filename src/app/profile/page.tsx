'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface UserData {
  _id: string;
  name: string;
  email: string;
  role: string;
  phone?: string;
  createdAt: string;
}

interface AttendanceRecord {
  _id: string;
  userId: string;
  date: string;
  checkIn: string;
  checkOut?: string;
  totalHours?: number;
  status: 'present' | 'absent' | 'late';
  createdAt: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<AttendanceRecord | null>(null);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);
  const [attendanceTab, setAttendanceTab] = useState<'today' | 'history'>('today');
  
  // Camera and photo states
  const [showCamera, setShowCamera] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);
  const [canvasRef, setCanvasRef] = useState<HTMLCanvasElement | null>(null);

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const [currentTime, setCurrentTime] = useState(getCurrentTime());

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(getCurrentTime());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Handle video element when camera is active
  useEffect(() => {
    if (showCamera && videoRef && cameraStream) {
      videoRef.srcObject = cameraStream;
      videoRef.play().catch(err => console.error('Error playing video:', err));
    }
  }, [showCamera, videoRef, cameraStream]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/auth/check', {
          credentials: 'include',
        });
        
        if (!response.ok) {
          router.push('/login');
          return;
        }

        const data = await response.json();
        if (data.authenticated && data.user) {
          setUserData(data.user);
          setEditForm({
            name: data.user.name || '',
            email: data.user.email || '',
            phone: data.user.phone || ''
          });
        } else {
          router.push('/login');
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        setError('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  // Fetch attendance data
  useEffect(() => {
    if (userData?._id) {
      fetchAttendanceData();
    }
  }, [userData]);

  const fetchAttendanceData = async () => {
    try {
      setIsLoadingAttendance(true);
      
      // Fetch today's attendance
      const todayResponse = await fetch(`/api/attendance/today`, {
        credentials: 'include',
      });
      
      if (todayResponse.ok) {
        const todayData = await todayResponse.json();
        setTodayAttendance(todayData.attendance || null);
      }

      // Fetch attendance history
      const historyResponse = await fetch(`/api/attendance/history`, {
        credentials: 'include',
      });
      
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        setAttendanceRecords(historyData.records || []);
      }
    } catch (error) {
      console.error('Error fetching attendance data:', error);
    } finally {
      setIsLoadingAttendance(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
    setSuccess(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditForm({
      name: userData?.name || '',
      email: userData?.email || '',
      phone: userData?.phone || ''
    });
    setError(null);
    setSuccess(null);
  };

  const handleSave = async () => {
    try {
      setError(null);
      setSuccess(null);

      const response = await fetch(`/api/users/${userData?._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        setUserData(updatedUser);
        setIsEditing(false);
        setSuccess('Profile updated successfully!');
      } else {
        setError('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile');
    }
  };



  // Camera functions
  const startCamera = async () => {
    try {
      console.log('Starting camera...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        } 
      });
      console.log('Camera stream obtained:', stream);
      setCameraStream(stream);
      setShowCamera(true);
      setError(null); // Clear any previous errors
    } catch (error) {
      console.error('Error accessing camera:', error);
      setError('Unable to access camera. Please check permissions and ensure camera is not in use by another application.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCamera(false);
    setCapturedPhoto(null);
  };

  const capturePhoto = () => {
    if (videoRef && canvasRef) {
      setIsCapturing(true);
      const context = canvasRef.getContext('2d');
      if (context) {
        canvasRef.width = videoRef.videoWidth;
        canvasRef.height = videoRef.videoHeight;
        context.drawImage(videoRef, 0, 0);
        const photoData = canvasRef.toDataURL('image/jpeg', 0.8);
        setCapturedPhoto(photoData);
        stopCamera();
      }
      setIsCapturing(false);
    }
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
    startCamera();
  };

  const handleCheckIn = async () => {
    if (!capturedPhoto) {
      setError('Please take a photo to mark attendance');
      return;
    }

    try {
      setIsLoadingAttendance(true);
      setError(null);

      const response = await fetch('/api/attendance/check-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ photo: capturedPhoto }),
      });

      if (response.ok) {
        const data = await response.json();
        setTodayAttendance(data.attendance);
        setSuccess('Check-in successful!');
        setCapturedPhoto(null);
        await fetchAttendanceData();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to check in');
      }
    } catch (error) {
      console.error('Error checking in:', error);
      setError('Failed to check in');
    } finally {
      setIsLoadingAttendance(false);
    }
  };

  const handleCheckOut = async () => {
    if (!capturedPhoto) {
      setError('Please take a photo to mark attendance');
      return;
    }

    try {
      setIsLoadingAttendance(true);
      setError(null);

      const response = await fetch('/api/attendance/check-out', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ photo: capturedPhoto }),
      });

      if (response.ok) {
        const data = await response.json();
        setTodayAttendance(data.attendance);
        setSuccess('Check-out successful!');
        setCapturedPhoto(null);
        await fetchAttendanceData();
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to check out');
      }
    } catch (error) {
      console.error('Error checking out:', error);
      setError('Failed to check out');
    } finally {
      setIsLoadingAttendance(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-green-100 text-green-800';
      case 'late':
        return 'bg-yellow-100 text-yellow-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!userData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
              <p className="text-gray-600 mt-2">Manage your account information</p>
            </div>
            <button
              onClick={() => router.back()}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="xl:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 h-full">
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
                  {!isEditing && (
                    <button
                      onClick={handleEdit}
                      className="flex items-center px-3 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors duration-200 bg-white rounded-lg shadow-sm border border-blue-200"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                  )}
                </div>
              </div>

              <div className="p-6">
                {error && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                )}

                {success && (
                  <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-green-600 text-sm">{success}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter your full name"
                      />
                    ) : (
                      <p className="text-gray-900 font-medium">{userData.name || 'Not provided'}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter your email"
                      />
                    ) : (
                      <p className="text-gray-900 font-medium">{userData.email}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter your phone number"
                      />
                    ) : (
                      <p className="text-gray-900 font-medium">{userData.phone || 'Not provided'}</p>
                    )}
                  </div>

                  {/* Role */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role
                    </label>
                    <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
                      {userData.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                  </div>

                  {/* Member Since */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Member Since
                    </label>
                    <p className="text-gray-900 font-medium">
                      {new Date(userData.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                {/* Action Buttons */}
                {isEditing && (
                  <div className="flex space-x-3 pt-6">
                    <button
                      onClick={handleSave}
                      className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-sm"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={handleCancel}
                      className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all duration-200"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Profile Summary */}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-full">
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{userData.name || 'User'}</h3>
                <p className="text-gray-600 text-sm mb-3">{userData.email}</p>
                <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-sm">
                  {userData.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Attendance Section - Full Width */}
        <div className="mt-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Attendance</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setAttendanceTab('today')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      attendanceTab === 'today'
                        ? 'bg-green-500 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-800 bg-white border border-gray-200'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setAttendanceTab('history')}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                      attendanceTab === 'history'
                        ? 'bg-green-500 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-800 bg-white border border-gray-200'
                    }`}
                  >
                    History
                  </button>
                </div>
              </div>
            </div>

            <div className="p-6">
              {attendanceTab === 'today' ? (
                <div>
                  {/* Today's Attendance */}
                  <div className="text-center mb-6">
                    <div className="text-3xl font-bold text-gray-900 mb-2">
                      {currentTime}
                    </div>
                    <div className="text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg inline-block">
                      {new Date().toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  </div>

                  {/* Photo Capture Section */}
                  {!todayAttendance && (
                    <div className="mb-6">
                      <div className="text-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Take Attendance Photo</h3>
                        <p className="text-gray-600 text-sm">Please take a selfie to mark your attendance</p>
                      </div>
                      
                      {!showCamera && !capturedPhoto && (
                        <div className="flex justify-center">
                          <button
                            onClick={startCamera}
                            className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition-all duration-200 font-medium shadow-lg"
                          >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            Open Camera
                          </button>
                        </div>
                      )}

                      {showCamera && (
                        <div className="flex flex-col items-center">
                          <div className="relative bg-black rounded-lg overflow-hidden mb-4">
                            <video
                              ref={(el) => setVideoRef(el)}
                              autoPlay
                              playsInline
                              muted
                              className="w-full max-w-md h-auto"
                              onLoadedMetadata={() => {
                                if (videoRef) {
                                  videoRef.play().catch(err => console.error('Error playing video:', err));
                                }
                              }}
                            />
                            <canvas
                              ref={(el) => setCanvasRef(el)}
                              className="hidden"
                            />
                          </div>
                          <div className="flex space-x-4">
                            <button
                              onClick={capturePhoto}
                              disabled={isCapturing}
                              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200 font-medium shadow-lg disabled:opacity-50"
                            >
                              {isCapturing ? 'Capturing...' : 'Take Photo'}
                            </button>
                            <button
                              onClick={stopCamera}
                              className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all duration-200 font-medium"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {capturedPhoto && (
                        <div className="flex flex-col items-center">
                          <div className="mb-4">
                            <img
                              src={capturedPhoto}
                              alt="Captured photo"
                              className="w-full max-w-md h-auto rounded-lg border-2 border-gray-200"
                              loading="lazy"
                            />
                          </div>
                          <div className="flex space-x-4">
                            <button
                              onClick={retakePhoto}
                              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all duration-200 font-medium"
                            >
                              Retake Photo
                            </button>
                            <button
                              onClick={handleCheckIn}
                              disabled={isLoadingAttendance}
                              className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-200 font-medium shadow-lg disabled:opacity-50"
                            >
                              {isLoadingAttendance ? 'Processing...' : 'Check In with Photo'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {todayAttendance ? (
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 mb-6 border border-green-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="text-center">
                          <div className="text-sm text-gray-600 mb-2 font-medium">Check In</div>
                          <div className="text-lg font-bold text-green-600 bg-white px-4 py-2 rounded-lg shadow-sm">
                            {todayAttendance.checkIn}
                          </div>
                        </div>
                        {todayAttendance.checkOut && (
                          <div className="text-center">
                            <div className="text-sm text-gray-600 mb-2 font-medium">Check Out</div>
                            <div className="text-lg font-bold text-red-600 bg-white px-4 py-2 rounded-lg shadow-sm">
                              {todayAttendance.checkOut}
                            </div>
                          </div>
                        )}
                      </div>
                      {todayAttendance.totalHours && (
                        <div className="text-center mt-6">
                          <div className="text-sm text-gray-600 mb-2 font-medium">Total Hours</div>
                          <div className="text-lg font-bold text-blue-600 bg-white px-4 py-2 rounded-lg shadow-sm">
                            {todayAttendance.totalHours.toFixed(2)} hours
                          </div>
                        </div>
                      )}
                      <div className="text-center mt-6">
                        <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(todayAttendance.status)} shadow-sm`}>
                          {todayAttendance.status.charAt(0).toUpperCase() + todayAttendance.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center mb-6">
                      <div className="text-gray-500 text-sm bg-gray-50 px-4 py-3 rounded-lg">No attendance recorded for today</div>
                    </div>
                  )}

                  {/* Check Out with Photo */}
                  {todayAttendance && !todayAttendance.checkOut && (
                    <div className="text-center">
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Check Out with Photo</h3>
                        <p className="text-gray-600 text-sm">Take a photo to check out</p>
                      </div>
                      
                      {!showCamera && !capturedPhoto && (
                        <button
                          onClick={startCamera}
                          className="flex items-center mx-auto px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:from-red-600 hover:to-pink-600 transition-all duration-200 font-medium shadow-lg"
                        >
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Take Check-out Photo
                        </button>
                      )}

                      {capturedPhoto && (
                        <div className="flex flex-col items-center">
                          <div className="mb-4">
                            <img
                              src={capturedPhoto}
                              alt="Captured photo"
                              className="w-full max-w-md h-auto rounded-lg border-2 border-gray-200"
                              loading="lazy"
                            />
                          </div>
                          <div className="flex space-x-4">
                            <button
                              onClick={retakePhoto}
                              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-all duration-200 font-medium"
                            >
                              Retake Photo
                            </button>
                            <button
                              onClick={handleCheckOut}
                              disabled={isLoadingAttendance}
                              className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:from-red-600 hover:to-pink-600 transition-all duration-200 font-medium shadow-lg disabled:opacity-50"
                            >
                              {isLoadingAttendance ? 'Processing...' : 'Check Out with Photo'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {todayAttendance && todayAttendance.checkOut && (
                    <div className="text-center text-gray-600 bg-green-50 px-6 py-4 rounded-xl border border-green-200">
                      <svg className="w-8 h-8 mx-auto mb-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm font-medium">Attendance completed for today</p>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  {/* Attendance History */}
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Attendance History</h3>
                    {isLoadingAttendance ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-2 text-gray-600 text-sm">Loading attendance history...</p>
                      </div>
                    ) : attendanceRecords.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check In</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check Out</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {attendanceRecords.map((record) => (
                              <tr key={record._id} className="hover:bg-gray-50">
                                <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                                  {new Date(record.date).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                                  {record.checkIn}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                                  {record.checkOut || '-'}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-900">
                                  {record.totalHours ? `${record.totalHours.toFixed(2)}h` : '-'}
                                </td>
                                <td className="px-3 py-2 whitespace-nowrap">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                                    {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <svg className="w-8 h-8 mx-auto text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <p className="text-gray-500 text-sm">No attendance records found</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 