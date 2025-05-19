'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { TermInsuranceType } from '@/models/TermInsurance';
import { LeadType } from '@/models/Lead';

export default function ViewVerificationPage() {
  const { id } = useParams();
  const router = useRouter();
  const [lead, setLead] = useState<LeadType | null>(null);
  const [verification, setVerification] = useState<TermInsuranceType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch lead data
        const leadRes = await fetch(`/api/leads/${id}`);
        if (!leadRes.ok) throw new Error('Failed to fetch lead');
        const leadData = await leadRes.json();
        setLead(leadData);

        // Fetch verification data
        const verificationRes = await fetch(`/api/leads/${id}/term-insurance`);
        if (!verificationRes.ok) throw new Error('Failed to fetch verification data');
        const verificationData = await verificationRes.json();
        setVerification(verificationData);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load verification details');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const updateStatus = async (newStatus: 'Under Review' | 'Approved' | 'Rejected') => {
    try {
      const response = await fetch(`/api/leads/${id}/term-insurance`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update status');
      
      const updatedData = await response.json();
      setVerification(updatedData);
    } catch (error) {
      console.error('Error updating status:', error);
      setError('Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 text-red-700 p-4 rounded-md">
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (!verification) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-yellow-50 text-yellow-700 p-4 rounded-md">
            No verification data found for this lead.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Verification Details</h1>
          <div className="flex gap-4">
            <Link
              href="/verification"
              className="text-blue-600 hover:text-blue-800"
            >
              Back to List
            </Link>
            <Link
              href={`/leads/${id}`}
              className="text-blue-600 hover:text-blue-800"
            >
              View Lead
            </Link>
          </div>
        </div>

        {/* Status Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Status</h2>
              <p className="text-sm text-gray-500">Current verification status</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => updateStatus('Under Review')}
                className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-md hover:bg-yellow-200"
                disabled={verification.status === 'Under Review'}
              >
                Mark Under Review
              </button>
              <button
                onClick={() => updateStatus('Approved')}
                className="px-4 py-2 bg-green-100 text-green-800 rounded-md hover:bg-green-200"
                disabled={verification.status === 'Approved'}
              >
                Approve
              </button>
              <button
                onClick={() => updateStatus('Rejected')}
                className="px-4 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200"
                disabled={verification.status === 'Rejected'}
              >
                Reject
              </button>
            </div>
          </div>
        </div>

        {/* Insurance Company Details */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Insurance Company Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Selected Company</p>
              <p className="font-medium">{verification.selectedCompany}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Insurance Type</p>
              <p className="font-medium">{verification.insuranceType}</p>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-medium">{verification.name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Mobile Number</p>
              <p className="font-medium">{verification.mobileNo}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Alternate Number</p>
              <p className="font-medium">{verification.alternateNo}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{verification.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Date of Birth</p>
              <p className="font-medium">{verification.dateOfBirth}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Education</p>
              <p className="font-medium">{verification.education}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Occupation</p>
              <p className="font-medium">{verification.occupation}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Organization Name</p>
              <p className="font-medium">{verification.organizationName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Work Belongs To</p>
              <p className="font-medium">{verification.workBelongsTo}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Annual Income</p>
              <p className="font-medium">₹{verification.annualIncome}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Years of Working</p>
              <p className="font-medium">{verification.yearsOfWorking}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Current Address</p>
              <p className="font-medium">{verification.currentAddress}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Permanent Address</p>
              <p className="font-medium">{verification.permanentAddress}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Marital Status</p>
              <p className="font-medium">{verification.maritalStatus}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Place of Birth</p>
              <p className="font-medium">{verification.placeOfBirth}</p>
            </div>
          </div>
        </div>

        {/* Family Information */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Family Information</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Father's Name</p>
              <p className="font-medium">{verification.fatherName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Father's Age</p>
              <p className="font-medium">{verification.fatherAge}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Father's Status</p>
              <p className="font-medium">{verification.fatherStatus}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Mother's Name</p>
              <p className="font-medium">{verification.motherName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Mother's Age</p>
              <p className="font-medium">{verification.motherAge}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Mother's Status</p>
              <p className="font-medium">{verification.motherStatus}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Spouse's Name</p>
              <p className="font-medium">{verification.spouseName || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Spouse's Age</p>
              <p className="font-medium">{verification.spouseAge || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Nominee Name</p>
              <p className="font-medium">{verification.nomineeName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Nominee Relation</p>
              <p className="font-medium">{verification.nomineeRelation}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Nominee Date of Birth</p>
              <p className="font-medium">{verification.nomineeDOB}</p>
            </div>
          </div>
        </div>

        {/* Insurance Details */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Insurance Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">LA Proposal</p>
              <p className="font-medium">{verification.laProposal}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">LA Name</p>
              <p className="font-medium">{verification.laName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">LA Date of Birth</p>
              <p className="font-medium">{verification.laDob}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Age</p>
              <p className="font-medium">{verification.age}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Height</p>
              <p className="font-medium">{verification.heightFt}' {verification.heightIn}"</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Weight</p>
              <p className="font-medium">{verification.weight} kg</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Designation</p>
              <p className="font-medium">{verification.designation}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Existing Policy</p>
              <p className="font-medium">{verification.existingPolicy || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Premium Amount</p>
              <p className="font-medium">₹{verification.premiumAmount}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Remarks</p>
              <p className="font-medium">{verification.remarks || '-'}</p>
            </div>
          </div>
        </div>

        {/* Documents */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Documents</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">PAN Number</p>
              <p className="font-medium">{verification.panNumber}</p>
              {verification.panPhoto && (
                <a
                  href={verification.panPhoto}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm mt-1 inline-block"
                >
                  View PAN Card
                </a>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500">Aadhaar Number</p>
              <p className="font-medium">{verification.aadharNumber}</p>
              {verification.aadharPhoto && (
                <a
                  href={verification.aadharPhoto}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm mt-1 inline-block"
                >
                  View Aadhaar Card
                </a>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500">User Photo</p>
              {verification.userPhoto && (
                <a
                  href={verification.userPhoto}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm mt-1 inline-block"
                >
                  View Photo
                </a>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500">Cancelled Cheque</p>
              {verification.cancelledCheque && (
                <a
                  href={verification.cancelledCheque}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm mt-1 inline-block"
                >
                  View Cheque
                </a>
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500">Bank Statement</p>
              {verification.bankStatement && (
                <a
                  href={verification.bankStatement}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm mt-1 inline-block"
                >
                  View Statement
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
