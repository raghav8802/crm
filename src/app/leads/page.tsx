'use client';

import { useState, useEffect, useCallback } from 'react';
import { LeadType } from '@/models/Lead';
import { UserType } from '@/models/User';
import Link from 'next/link';

export default function LeadsPage() {
  const [leads, setLeads] = useState<LeadType[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [showImportModal, setShowImportModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importStatus, setImportStatus] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);
  const [currentUser, setCurrentUser] = useState<{ _id: string; role: string } | null>(null);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/check');
      if (!res.ok) throw new Error('Failed to fetch user');
      const data = await res.json();
      console.log('Current User:', data.user);
      setCurrentUser(data.user);
    } catch (err) {
      console.error('Error fetching user:', err);
    }
  }, []);

  const fetchLeads = useCallback(async () => {
    try {
      const res = await fetch('/api/leads');
      if (!res.ok) {
        throw new Error('Failed to fetch leads');
      }
      const data = await res.json();
      console.log('All Leads:', data);
      
      // Filter leads based on user role
      const filteredLeads = currentUser?.role === 'admin' 
        ? data 
        : data.filter((lead: LeadType) => String(lead.assignedTo) === String(currentUser?._id));
      
      setLeads(filteredLeads);
    } catch (err) {
      setError('Error loading leads');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
    fetchUsers();
  }, [fetchCurrentUser, fetchUsers]);

  // Set selected user when currentUser changes
  useEffect(() => {
    if (currentUser?._id) {
      setSelectedUserId(currentUser._id);
    }
  }, [currentUser]);

  // Update leads when currentUser changes
  useEffect(() => {
    if (currentUser) {
      fetchLeads();
    }
  }, [currentUser, fetchLeads]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this lead?')) {
      return;
    }

    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Failed to delete lead');
      }

      await fetchLeads(); // Refresh the leads list
    } catch (error) {
      console.error('Error:', error);
      alert('Error deleting lead. Please try again.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const response = await fetch('/api/leads/import', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();
      setImportStatus(result);
      
      if (result.success > 0) {
        fetchLeads(); // Refresh the leads list
      }
    } catch (error) {
      console.error('Error importing leads:', error);
      setImportStatus({
        success: 0,
        failed: 0,
        errors: ['Failed to import leads. Please try again.'],
      });
    }
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u._id === userId);
    return user ? user.name : 'Unassigned';
  };

  const filteredLeads = leads.filter(lead => {
    // Exclude leads with 'Won' status
    if (lead.status === 'Won') {
      return false;
    }

    // Filter by selected user if one is selected
    if (selectedUserId && lead.assignedTo !== selectedUserId) {
      return false;
    }
    // Filter by selected status if one is selected
    if (selectedStatus && lead.status !== selectedStatus) {
      return false;
    }
    // Filter by month if selected
    if (selectedMonth) {
      const leadDate = new Date(lead.createdAt || '');
      const [year, month] = selectedMonth.split('-');
      if (leadDate.getFullYear() !== parseInt(year) || leadDate.getMonth() !== parseInt(month) - 1) {
        return false;
      }
    }
    // Filter by date range if selected
    if (dateRange.startDate && dateRange.endDate) {
      const leadDate = new Date(lead.createdAt || '');
      const startDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);
      if (leadDate < startDate || leadDate > endDate) {
        return false;
      }
    }
    // Filter by search query
    const query = searchQuery.toLowerCase();
    return (
      lead.name.toLowerCase().includes(query) ||
      lead.phoneNumber.toLowerCase().includes(query) ||
      (lead.email?.toLowerCase() || '').includes(query)
    );
  });

  console.log('Filtered Leads:', filteredLeads);

  if (loading) {
    return <div className="p-6">Loading leads...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  if (!currentUser) {
    return <div className="p-6 text-red-600">Please log in to view leads</div>;
  }

  return (
    <div className="space-y-4 p-2 sm:p-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Leads</h1>
            <span className="text-sm text-gray-600">Total: {filteredLeads.length}</span>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => setShowImportModal(true)}
              className="w-full sm:w-auto bg-green-600 text-white px-3 sm:px-4 py-2 rounded-md hover:bg-green-700 text-sm sm:text-base"
            >
              Import Leads
            </button>
            <Link 
              href="/leads/add" 
              className="w-full sm:w-auto bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-md hover:bg-blue-700 text-sm sm:text-base text-center"
            >
              Add New Lead
            </Link>
          </div>
        </div>

        {/* Filters Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>

          {/* Month Selector */}
          <div className="w-full">
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setDateRange({ startDate: '', endDate: '' });
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Month</option>
              {Array.from({ length: 12 }, (_, i) => {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                return (
                  <option key={i} value={`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`}>
                    {date.toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => {
                setDateRange(prev => ({ ...prev, startDate: e.target.value }));
                setSelectedMonth('');
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Start Date"
            />
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => {
                setDateRange(prev => ({ ...prev, endDate: e.target.value }));
                setSelectedMonth('');
              }}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="End Date"
            />
          </div>

          {/* User and Status Filters */}
          <div className="grid grid-cols-2 gap-2">
            {currentUser?.role === 'admin' && (
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Users</option>
                {users.map((user) => (
                  <option key={user._id} value={user._id}>
                    {user.name}
                  </option>
                ))}
              </select>
            )}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="Fresh">Fresh</option>
              <option value="Interested">Interested</option>
              <option value="Callback Later">Callback Later</option>
              <option value="Wrong Number">Wrong Number</option>
              <option value="Lost">Lost</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white shadow-sm rounded-lg overflow-x-auto">
        <div className="min-w-full inline-block align-middle">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-xs sm:text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-3 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="hidden sm:table-cell px-3 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-3 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="hidden sm:table-cell px-3 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                  <th className="px-3 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-3 py-4 text-center text-gray-500">
                      {searchQuery ? 'No leads found matching your search.' : 'No leads found. Click "Add New Lead" to get started.'}
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => (
                    <tr key={lead._id} className="hover:bg-gray-50">
                      <td className="px-3 py-4 whitespace-nowrap">
                        <Link 
                          href={`/leads/${lead._id}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {lead.name}
                        </Link>
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">{lead.phoneNumber}</td>
                      <td className="hidden sm:table-cell px-3 py-4 whitespace-nowrap">{lead.email || '-'}</td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${lead.status === 'Fresh' ? 'bg-blue-100 text-blue-800' : 
                            lead.status === 'Interested' ? 'bg-green-100 text-green-800' :
                            lead.status === 'Callback Later' ? 'bg-yellow-100 text-yellow-800' :
                            lead.status === 'Wrong Number' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'}`}>
                          {lead.status}
                        </span>
                      </td>
                      <td className="hidden sm:table-cell px-3 py-4 whitespace-nowrap">
                        {lead.assignedTo ? (
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                            {getUserName(lead.assignedTo)}
                          </span>
                        ) : (
                          <span className="text-gray-500">Unassigned</span>
                        )}
                      </td>
                      <td className="px-3 py-4 whitespace-nowrap">
                        <div className="flex space-x-3">
                          <Link
                            href={`/leads/${lead._id}/edit`}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => lead._id && handleDelete(lead._id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md">
            <h2 className="text-lg sm:text-xl font-semibold mb-4">Import Leads</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Excel File
              </label>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            {importStatus && (
              <div className="mb-4">
                <p className="text-green-600">Successfully imported: {importStatus.success}</p>
                <p className="text-red-600">Failed: {importStatus.failed}</p>
                {importStatus.errors.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-gray-700">Errors:</p>
                    <ul className="list-disc list-inside text-sm text-red-600">
                      {importStatus.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setSelectedFile(null);
                  setImportStatus(null);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={!selectedFile}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 