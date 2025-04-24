'use client';

import { useState, useEffect } from 'react';
import { LeadType } from '@/models/Lead';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function LeadsPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<LeadType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchLeads = async () => {
    try {
      const res = await fetch('/api/leads');
      if (!res.ok) {
        throw new Error('Failed to fetch leads');
      }
      const data = await res.json();
      setLeads(data);
    } catch (err) {
      setError('Error loading leads');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this lead?')) {
      return;
    }

    setDeletingId(id);
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
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return <div className="p-6">Loading leads...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
        <Link 
          href="/leads/add" 
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Add New Lead
        </Link>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assigned To
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {leads.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  No leads found. Click "Add New Lead" to get started.
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr key={lead._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link 
                      href={`/leads/${lead._id}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {lead.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{lead.phoneNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{lead.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${lead.status === 'Fresh' ? 'bg-blue-100 text-blue-800' : 
                        lead.status === 'Interested' ? 'bg-green-100 text-green-800' :
                        lead.status === 'Callback Later' ? 'bg-yellow-100 text-yellow-800' :
                        lead.status === 'Wrong Number' ? 'bg-red-100 text-red-800' :
                        lead.status === 'Won' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'}`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {lead.assignedTo ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        {lead.assignedTo}
                      </span>
                    ) : (
                      <span className="text-gray-500">Unassigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
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
  );
} 