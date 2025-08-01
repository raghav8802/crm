'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserType } from '@/models/User';

const educationOptions = [
  { value: '10th', label: '10th' },
  { value: '12th', label: '12th' },
  { value: 'Graduate', label: 'Graduate' },
  { value: 'Post Graduate', label: 'Post Graduate' },
  { value: 'Other', label: 'Other' },
];

const sourceOptions = [
  { value: 'IVR', label: 'IVR' },
  { value: 'META', label: 'META' },
  { value: 'GOOGLE', label: 'GOOGLE' },
  { value: 'SELF', label: 'SELF' },
];

export default function AddLead() {
  const router = useRouter();
  const [users, setUsers] = useState<UserType[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    altNumber: '',
    gender: '',
    dateOfBirth: '',
    age: '',
    tabacoUser: 'no',
    annualIncome: '',
    occupation: '',
    education: '12th',
    address: '',
    status: 'Fresh',
    assignedTo: '',
    assignedFrom: '',
    source: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch('/api/users');
        if (!res.ok) throw new Error('Failed to fetch users');
        const data = await res.json();
        setUsers(data);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    const fetchCurrentUser = async () => {
      try {
        const userRes = await fetch('/api/auth/check', {
          credentials: 'include',
        });
        if (userRes.ok) {
          const userData = await userRes.json();
          if (userData.authenticated && userData.user && userData.user._id) {
            setCurrentUserId(userData.user._id);
            setFormData(prev => ({ ...prev, assignedFrom: userData.user._id }));
          }
        }
      } catch (error) {
        console.error('Error fetching current user:', error);
      }
    };

    fetchUsers();
    fetchCurrentUser();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if current user ID is available
    if (!currentUserId) {
      alert('User session not found. Please refresh the page and try again.');
      return;
    }
    
    setLoading(true);

    try {
      // Ensure assignedFrom is set to current user before submission
      const finalFormData = {
        ...formData,
        assignedFrom: currentUserId
      };

      // Log the form data being sent
      console.log('Submitting form data:', finalFormData);

      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(finalFormData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create lead');
      }

      const createdLead = await res.json();
      console.log('Created lead:', createdLead);

      router.push('/leads');
    } catch (error) {
      console.error('Error:', error);
      alert('Error creating lead: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
        <h1 className="text-2xl font-bold text-center text-gray-900 mb-8">Add New Lead</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Required Fields */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                placeholder="Enter Name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                placeholder="Enter Email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                id="phoneNumber"
                type="tel"
                pattern="[0-9]{10}"
                maxLength={10}
                minLength={10}
                placeholder="Enter 10-digit Phone Number"
                required
                value={formData.phoneNumber}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setFormData({ ...formData, phoneNumber: value });
                }}
                onKeyPress={(e) => {
                  if (!/[0-9]/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              {formData.phoneNumber.length > 0 && formData.phoneNumber.length !== 10 && (
                <p className="mt-1 text-sm text-red-600">Please enter exactly 10 digits</p>
              )}
            </div>

            {/* Optional Fields */}
            <div>
              <label htmlFor="altNumber" className="block text-sm font-medium text-gray-700">Alternative Number </label>
              <input
                id="altNumber"
                type="tel"
                pattern="[0-9]{10}"
                maxLength={10}
                placeholder="Enter Alternative Number"
                value={formData.altNumber}
                onChange={(e) => setFormData({ ...formData, altNumber: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"               
              />
            </div>

            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700">Gender <span className="text-red-500">*</span></label>
              <select
                id="gender"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">Date of Birth <span className="text-red-500">*</span></label>
              <input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="age" className="block text-sm font-medium text-gray-700">Age <span className="text-red-500">*</span></label>
              <input
                id="age"
                type="number"
                placeholder="Enter Age"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="tabacoUser" className="block text-sm font-medium text-gray-700">Tobacco User <span className="text-red-500">*</span></label>
              <select
                id="tabacoUser"
                value={formData.tabacoUser}
                onChange={(e) => setFormData({ ...formData, tabacoUser: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                
              >
                <option value="no">No</option>
                <option value="yes">Yes</option>
              </select>
            </div>

            <div>
              <label htmlFor="annualIncome" className="block text-sm font-medium text-gray-700">Annual Income <span className="text-red-500">*</span></label>
              <input
                id="annualIncome"
                type="text"
                placeholder="Enter Annual Income"
                value={formData.annualIncome}
                onChange={(e) => setFormData({ ...formData, annualIncome: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                
              />
            </div>

            <div>
              <label htmlFor="occupation" className="block text-sm font-medium text-gray-700">Occupation <span className="text-red-500">*</span></label>
              <input
                id="occupation"
                type="text"
                placeholder="Enter Occupation"
                value={formData.occupation}
                onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                
              />
            </div>

            <div>
              <label htmlFor="education" className="block text-sm font-medium text-gray-700">Education <span className="text-red-500">*</span></label>
              <select
                id="education"
                value={formData.education}
                onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                
              >
                {educationOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">Address <span className="text-red-500">*</span></label>
              <textarea
                id="address"
                placeholder="Enter Address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
               
              />
            </div>

            <div>
              <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700">Assign To <span className="text-red-500">*</span></label>
              <select
                id="assignedTo"
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              >
                <option value="">Select User</option>
                {users.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.name} ({user.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="source" className="block text-sm font-medium text-gray-700">Lead Source <span className="text-red-500">*</span></label>
              <select
                id="source"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              >
                <option value="">Select Source</option>
                {sourceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors duration-200"
            >
              {loading ? 'Creating...' : 'Create Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 