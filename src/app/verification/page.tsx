'use client';

import { useState, useEffect } from 'react';
import { LeadType } from '@/models/Lead';
import { UserType } from '@/models/User';
import Link from 'next/link';
import * as XLSX from 'xlsx';

interface VerificationDetails {
  _id: string;
  leadId: string;
  insuranceType: 'term_insurance' | 'health_insurance' | 'life_insurance' | 'car_insurance';
  status: 'submitted' | 'processing' | 'link_created' | 'payment_done' | 'PLVC_verification' | 'PLVC_done';
  createdAt: string;
  updatedAt: string;
}

export default function VerificationPage() {
  const [leads, setLeads] = useState<LeadType[]>([]);
  const [users, setUsers] = useState<UserType[]>([]);
  const [verificationDetails, setVerificationDetails] = useState<VerificationDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState<{ _id: string; role: string } | null>(null);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch current user data
        const userRes = await fetch('/api/auth/check');
        if (!userRes.ok) throw new Error('Failed to fetch user data');
        const userData = await userRes.json();
        setCurrentUser(userData.user);

        // Fetch won leads
        const leadsRes = await fetch('/api/leads?status=Won');
        if (!leadsRes.ok) throw new Error('Failed to fetch leads');
        const leadsData = await leadsRes.json();

        // Fetch verification details for all insurance types
        const verificationRes = await fetch('/api/verification');
        if (!verificationRes.ok) throw new Error('Failed to fetch verification details');
        const verificationData = await verificationRes.json();
        console.log('Verification Data:', verificationData);
        setVerificationDetails(verificationData);

        // Filter leads based on user role
        console.log('User Role:', userData.user.role);
        console.log('All Leads:', leadsData);
        
        const filteredLeads = userData.user.role === 'admin' || userData.user.role === 'Payment_Coordinator'
          ? leadsData 
          : userData.user.role === 'PLVC_verificator'
            ? leadsData.filter((lead: LeadType) => {
                const verification = verificationData.find((v: VerificationDetails) => v.leadId === lead._id);
                console.log('Lead:', lead._id, 'Verification:', verification);
                return verification && ['payment_done', 'PLVC_verification', 'PLVC_done'].includes(verification.status);
              })
            : leadsData.filter((lead: LeadType) => String(lead.assignedTo) === String(userData.user._id));
        
        console.log('Filtered Leads:', filteredLeads);
        setLeads(filteredLeads);

        // Fetch users
        const usersRes = await fetch('/api/users');
        if (!usersRes.ok) throw new Error('Failed to fetch users');
        const usersData = await usersRes.json();
        setUsers(usersData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getUserName = (userId: string | undefined) => {
    if (!userId) return 'Unassigned';
    const user = users.find(u => u._id === userId);
    return user ? user.name : 'Unknown User';
  };

  const getVerificationStatus = (leadId: string | undefined) => {
    if (!leadId) return null;
    const verification = verificationDetails.find(v => v.leadId === leadId);
    if (!verification) return null;
    return {
      type: verification.insuranceType,
      status: verification.status,
      updatedAt: verification.updatedAt
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'link_created': return 'bg-purple-100 text-purple-800';
      case 'payment_done': return 'bg-indigo-100 text-indigo-800';
      case 'PLVC_verification': return 'bg-orange-100 text-orange-800';
      case 'PLVC_done': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getInsuranceTypePath = (type: string) => {
    switch (type) {
      case 'term_insurance':
        return 'term';
      case 'life_insurance':
        return 'life';
      case 'car_insurance':
        return 'car';
      case 'health_insurance':
        return 'health';
      default:
        return '';
    }
  };

  const maskPhoneNumber = (phone: string) => {
    if (phone.length <= 4) return phone;
    return phone.slice(0, 2) + '*'.repeat(phone.length - 4) + phone.slice(-2);
  };

  const maskEmail = (email: string) => {
    if (!email || email.length <= 3) return email;
    const [localPart, domain] = email.split('@');
    if (!domain) return email;
    const maskedLocal = localPart.slice(0, 2) + '*'.repeat(localPart.length - 2);
    return `${maskedLocal}@${domain}`;
  };

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phoneNumber.includes(searchQuery) ||
      lead.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const hasVerification = lead._id ? verificationDetails.some(v => v.leadId === lead._id) : false;
    return matchesSearch && hasVerification;
  });

  const handleSelectAll = () => {
    if (selectedLeads.size === filteredLeads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(filteredLeads.map(lead => lead._id || '')));
    }
  };

  const handleSelectLead = (leadId: string) => {
    const newSelected = new Set(selectedLeads);
    if (newSelected.has(leadId)) {
      newSelected.delete(leadId);
    } else {
      newSelected.add(leadId);
    }
    setSelectedLeads(newSelected);
  };

  const exportToExcel = async () => {
    try {
      // Filter leads based on selection
      const leadsToExport = selectedLeads.size > 0 
        ? filteredLeads.filter(lead => selectedLeads.has(lead._id || ''))
        : filteredLeads;

      // Get lead IDs for the API call
      const leadIds = leadsToExport.map(lead => lead._id).filter(Boolean);

      if (leadIds.length === 0) {
        alert('No leads selected for export');
        return;
      }

      // Fetch comprehensive verification data from the API
      const response = await fetch('/api/verification/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ leadIds }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch verification data');
      }

      const exportData = await response.json();

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      // Set column widths - make them wider for comprehensive data
      const columnWidths = Object.keys(exportData[0] || {}).map(key => ({ wch: Math.max(key.length, 15) }));
      worksheet['!cols'] = columnWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Verification Data');

      // Generate filename with current date
      const date = new Date().toISOString().split('T')[0];
      const filename = `comprehensive_verification_data_${date}.xlsx`;

      // Save file
      XLSX.writeFile(workbook, filename);
    } catch (error) {
      console.error('Error exporting data:', error);
      alert('Failed to export data. Please try again.');
    }
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Verification Queue</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-2">Review and verify insurance applications</p>
          </div>
          
          {currentUser?.role === 'admin' && (
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600">
                {selectedLeads.size > 0 ? `${selectedLeads.size} selected` : 'All leads'}
              </div>
              <button
                onClick={exportToExcel}
                className="w-full sm:w-auto bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 text-sm sm:text-base flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export {selectedLeads.size > 0 ? `(${selectedLeads.size})` : ''}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name, phone, or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
        />
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {currentUser?.role === 'admin' && (
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedLeads.size === filteredLeads.length && filteredLeads.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
              )}
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Insurance Type</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredLeads.map((lead) => {
              const verification = getVerificationStatus(lead._id);
              return (
                <tr key={lead._id} className="hover:bg-gray-50">
                  {currentUser?.role === 'admin' && (
                    <td className="px-3 py-2 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedLeads.has(lead._id || '')}
                        onChange={() => handleSelectLead(lead._id || '')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                  )}
                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                    {lead.name}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                    {currentUser?.role === 'sales_manager' ? maskPhoneNumber(lead.phoneNumber) : lead.phoneNumber}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                    {currentUser?.role === 'sales_manager' ? (lead.email ? maskEmail(lead.email) : '-') : (lead.email || '-')}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                    {verification?.type.replace('_', ' ').toUpperCase() || '-'}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {verification && (
                      <span className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded-full ${getStatusColor(verification.status)}`}>
                        {verification.status.toUpperCase()}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                    {getUserName(lead.assignedTo)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                    {currentUser?.role !== 'sales_manager' && (
                      <Link
                        href={
                          verification
                            ? `/leads/${lead._id}/verification/${getInsuranceTypePath(verification.type)}`
                            : '#'
                        }
                        className="text-blue-600 hover:text-blue-800"
                      >
                        View Details
                      </Link>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {filteredLeads.map((lead) => {
          const verification = getVerificationStatus(lead._id);
          return (
            <div key={lead._id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {currentUser?.role === 'admin' && (
                      <input
                        type="checkbox"
                        checked={selectedLeads.has(lead._id || '')}
                        onChange={() => handleSelectLead(lead._id || '')}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    )}
                    <h3 className="text-base font-semibold text-gray-900">{lead.name}</h3>
                  </div>
                  <div className="space-y-1 text-xs text-gray-600">
                    <div className="flex items-center">
                      <span className="font-medium w-14">Phone:</span>
                      <span>{currentUser?.role === 'sales_manager' ? maskPhoneNumber(lead.phoneNumber) : lead.phoneNumber}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium w-14">Email:</span>
                      <span>{currentUser?.role === 'sales_manager' ? (lead.email ? maskEmail(lead.email) : '-') : (lead.email || '-')}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium w-14">Type:</span>
                      <span>{verification?.type.replace('_', ' ').toUpperCase() || '-'}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium w-14">Assigned:</span>
                      <span>{getUserName(lead.assignedTo)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end space-y-2">
                  {verification && (
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(verification.status)}`}>
                      {verification.status.toUpperCase()}
                    </span>
                  )}
                  {currentUser?.role !== 'sales_manager' && (
                    <Link
                      href={
                        verification
                          ? `/leads/${lead._id}/verification/${getInsuranceTypePath(verification.type)}`
                          : '#'
                      }
                      className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                    >
                      View Details
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredLeads.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 text-sm sm:text-base">No verification records found.</p>
        </div>
      )}
    </div>
  );
} 