'use client';

import { useState, useEffect } from 'react';
import { LeadType } from '@/models/Lead';
import { UserType } from '@/models/User';
import Link from 'next/link';

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

  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phoneNumber.includes(searchQuery) ||
      lead.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const hasVerification = lead._id ? verificationDetails.some(v => v.leadId === lead._id) : false;
    return matchesSearch && hasVerification;
  });

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Verification Queue</h1>
        <p className="text-gray-600 mt-2">Review and verify insurance applications</p>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name, phone, or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Insurance Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredLeads.map((lead) => {
              const verification = getVerificationStatus(lead._id);
              return (
                <tr key={lead._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {lead.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {lead.phoneNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {lead.email || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {verification?.type.replace('_', ' ').toUpperCase() || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {verification && (
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(verification.status)}`}>
                        {verification.status.toUpperCase()}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getUserName(lead.assignedTo)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {verification ? new Date(verification.updatedAt).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
} 