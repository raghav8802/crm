'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { LeadType } from '@/models/Lead';
import { UserType } from '@/models/User';
import Link from 'next/link';

const leadStatuses = [
  { value: 'Fresh', label: 'Fresh' },
  { value: 'Interested', label: 'Interested' },
  { value: 'Ringing', label: 'Ringing' },
  { value: 'Follow Up', label: 'Follow Up' },
  { value: 'Call Disconnected', label: 'Call Disconnected' }, 
  { value: 'Callback Later', label: 'Callback Later' },
  { value: 'Wrong Number', label: 'Wrong Number' },
  { value: 'Won', label: 'Sale Done' },
  { value: 'Lost', label: 'Lost' },
];

export default function LeadDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const [lead, setLead] = useState<LeadType | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserType[]>([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [callbackTime, setCallbackTime] = useState('');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch users first to ensure names are available for rendering
        const usersRes = await fetch('/api/users');
        if (!usersRes.ok) throw new Error('Failed to fetch users');
        const usersData = await usersRes.json();
        setUsers(usersData);

        // Then fetch lead data
        const leadRes = await fetch(`/api/leads/${id}`);
        if (!leadRes.ok) throw new Error('Failed to fetch lead');
        const leadData = await leadRes.json();
        setLead(leadData);
        setSelectedStatus(leadData.status);
        setSelectedUser(leadData.assignedTo || '');

      } catch (error) {
        console.error('Error:', error);
        alert('Error loading data');
      } finally {
        setLoading(false);
      }
    };

    const fetchCurrentUser = async () => {
      try {
        const res = await fetch('/api/auth/check');
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);
        }
      } catch (e) {
        // handle error
      }
    };

    fetchData();
    fetchCurrentUser();
  }, [id]);

  useEffect(() => {
    setShowTimePicker(selectedStatus === 'Callback Later');
  }, [selectedStatus]);

  const handleAssign = async () => {
    if (!selectedUser) {
      alert('Please select a user');
      return;
    }

    setIsAssigning(true);
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...lead,
          assignedTo: selectedUser,
          performedBy: currentUser?.name
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to assign lead');
      }

      const updatedLead = await res.json();
      setLead(updatedLead);
      alert('Lead assigned successfully!');
      router.refresh();
    } catch (error) {
      console.error('Error:', error);
      alert('Error assigning lead');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedStatus) {
      alert('Please select a status');
      return;
    }

    if (selectedStatus === 'Callback Later' && !callbackTime) {
      alert('Please set a callback time');
      return;
    }

    setIsUpdatingStatus(true);
    try {
      // First update the lead status
      const leadRes = await fetch(`/api/leads/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...lead,
          status: selectedStatus,
          updatedAt: new Date(),
          performedBy: currentUser?.name,
        }),
      });

      if (!leadRes.ok) {
        throw new Error('Failed to update lead status');
      }

      const updatedLead = await leadRes.json();
      setLead(updatedLead);

      // If status is Callback Later, create a reminder
      if (selectedStatus === 'Callback Later') {
        const reminderRes = await fetch('/api/reminders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            leadId: id,
            scheduledTime: callbackTime,
          }),
        });

        if (!reminderRes.ok) {
          throw new Error('Failed to create reminder');
        }
      }

      alert('Status updated successfully!');
      
      // Redirect to /leads/[id]/select if status is Won
      if (selectedStatus === 'Won') {
        router.push(`/leads/${id}/select`);
      } else {
        router.refresh();
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error updating status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    
    setIsAddingNote(true);
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newNote: newNote.trim(),
          performedBy: currentUser?.name
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to add note');
      }

      const updatedLead = await res.json();
      setLead(updatedLead);
      setNewNote('');
      router.refresh();
    } catch (error) {
      console.error('Error:', error);
      alert('Error adding note');
    } finally {
      setIsAddingNote(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (!lead) {
    return <div className="p-6 text-red-600">Lead not found</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Lead Details</h1>
        <div className="flex items-center space-x-4">
          <a
            href={`tel:${lead.phoneNumber}`}
            className="p-2 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-50"
            title="Call Lead"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </a>
          <a
            href={`mailto:${lead.email}`}
            className="p-2 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-50"
            title="Email Lead"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </a>
          <Link
            href="/leads"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Back to Leads
          </Link>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Lead Details Card */}
        <div className="flex-1 bg-white shadow-sm rounded-lg p-6">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{lead.name}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900">{lead.email}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Phone Number</dt>
              <dd className="mt-1 text-sm text-gray-900">{lead.phoneNumber}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Alternative Number</dt>
              <dd className="mt-1 text-sm text-gray-900">{lead.altNumber || '-'}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Gender</dt>
              <dd className="mt-1 text-sm text-gray-900">{lead.gender || '-'}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Age</dt>
              <dd className="mt-1 text-sm text-gray-900">{lead.age || '-'}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Tabaco User</dt>
              <dd className="mt-1 text-sm text-gray-900">{lead.tabacoUser || '-'}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Annual Income</dt>
              <dd className="mt-1 text-sm text-gray-900">{lead.annualIncome || '-'}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Occupation</dt>
              <dd className="mt-1 text-sm text-gray-900">{lead.occupation || '-'}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Education</dt>
              <dd className="mt-1 text-sm text-gray-900">{lead.education || '-'}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Date of Birth</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {lead.dateOfBirth ? new Date(lead.dateOfBirth).toLocaleDateString() : '-'}
              </dd>
            </div>

            <div className="col-span-2">
              <dt className="text-sm font-medium text-gray-500">Address</dt>
              <dd className="mt-1 text-sm text-gray-900">{lead.address || '-'}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Created At</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {lead.createdAt ? new Date(lead.createdAt).toLocaleString() : '-'}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {lead.updatedAt ? new Date(lead.updatedAt).toLocaleString() : '-'}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-500">Source</dt>
              <dd className="mt-1 text-sm text-gray-900">{lead.source || '-'}</dd>
            </div>

            <div className="col-span-2">
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1">
                <div className="flex gap-2">
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {leadStatuses.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                  {showTimePicker && (
                    <input
                      type="datetime-local"
                      value={callbackTime}
                      onChange={(e) => setCallbackTime(e.target.value)}
                      className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  )}
                  <button
                    onClick={handleStatusUpdate}
                    disabled={isUpdatingStatus || selectedStatus === lead?.status}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {isUpdatingStatus ? 'Updating...' : 'Update Status'}
                  </button>
                </div>
                {lead?.status && (
                  <p className="mt-1 text-sm text-gray-500">
                    Current Status: <span className="font-medium">{lead.status === 'Won' ? 'Sale Done' : lead.status}</span>
                    {lead.callbackTime && (
                      <span className="ml-2">
                        (Callback scheduled for: {new Date(lead.callbackTime).toLocaleString()})
                      </span>
                    )}
                  </p>
                )}
              </dd>
            </div>
            <div className="col-span-2">
              <dt className="text-sm font-medium text-gray-500">Assigned To</dt>
              <dd className="mt-1">
                <div className="flex gap-2">
                  <select
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Select User</option>
                    {users.map((user) => (
                      <option key={user._id} value={user._id}>
                        {user.name} ({user.role})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleAssign}
                    disabled={isAssigning}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {isAssigning ? 'Assigning...' : 'Assign'}
                  </button>
                </div>
                {lead?.assignedTo && (
                  <p className="mt-1 text-sm text-gray-500">
                    Currently assigned to: <span className="font-medium">
                      {users.find(u => u._id === lead.assignedTo)?.name || 'Unknown User'}
                    </span>
                  </p>
                )}
              </dd>
            </div>

            <div className="col-span-2">
              <dt className="text-sm font-medium text-gray-500">Assigned From</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {lead?.assignedFrom
                  ? (users.find(u => u._id === lead.assignedFrom)?.name || 'Unknown User')
                  : '-'}
              </dd>
            </div>
          </dl>
        </div>

        {/* History Panel */}
        <div className="w-96 bg-white shadow-sm rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">History</h2>
          </div>

          <div className="space-y-4 overflow-y-auto" style={{ maxHeight: '400px' }}>
            {lead?.thread?.map((entry, index) => {
              // Try to extract assignedTo from details if present
              let assignedToName = null;
              if (entry.action === 'Assignment Update' && entry.details) {
                // Example details: "Assigned to 680f30afb8245940656a4705"
                const match = entry.details.match(/Assigned to ([a-fA-F0-9]{24})/);
                if (match) {
                  const user = users.find(u => u._id === match[1]);
                  assignedToName = user ? user.name : match[1];
                }
              }
              return (
                <div key={index} className="border-l-2 border-blue-500 pl-4">
                  <div className="flex justify-between text-sm text-gray-500">
                    <span>{entry.action}</span>
                    <span>{new Date(entry.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-700">
                    {assignedToName
                      ? `Assigned to ${assignedToName}`
                      : entry.details}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    By {entry.performedBy}
                  </p>
                </div>
              );
            })}

            {/* Initial creation entry */}
            <div className="border-l-2 border-green-500 pl-4">
              <div className="flex justify-between text-sm text-gray-500">
                <span>Lead Created</span>
                <span>{new Date(lead?.createdAt || '').toLocaleString()}</span>
              </div>
              <p className="mt-1 text-sm text-gray-700">Lead was created with initial details</p>
            </div>
          </div>
       

        {/* Notes Section */}
        <div className="col-span-2 mt-3">
          <dt className="text-sm font-medium text-gray-500 mt-5">Notes</dt>
          <dd className="mt-1">
            <div className="space-y-4 overflow-y-auto" style={{ maxHeight: '300px' }}>
              {lead?.thread?.filter(entry => entry.action === 'Note Added').map((entry, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-700">{entry.details}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Added by {entry.performedBy} on {new Date(entry.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
              <div className="mt-4">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  rows={3}
                />
                <button
                  onClick={handleAddNote}
                  disabled={isAddingNote || !newNote.trim()}
                  className="mt-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isAddingNote ? 'Adding...' : 'Add Note'}
                </button>
              </div>
            </div>
          </dd>
        </div>
        </div>
      </div>
    </div>
  );
} 