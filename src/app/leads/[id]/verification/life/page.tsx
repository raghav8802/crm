'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface LifeInsuranceVerification {
  _id: string;
  leadId: string;
  insuranceType: 'life_insurance';
  status: 'submitted' | 'processing' | 'link_created' | 'payment_done' | 'PLVC_verification' | 'PLVC_done';
  createdAt: string;
  updatedAt: string;

  // Initial Selection
  residentialStatus: 'Indian' | 'NRI';
  nationality: 'Indian' | 'NRI';
  policyFor: 'Self' | 'Dependent' | 'Business';

  // Company Selection
  selectedCompany: string;

  // Product Details
  productName: string;
  pt: string;
  ppt: string;
  planVariant: string;
  premium: string;
  isSmoker: 'Yes' | 'No';
  modeOfPayment: 'Annual' | 'Semi Annual' | 'Quarterly' | 'Monthly';
  premiumPaymentMethod: 'Single' | 'Regular' | 'Pay Till 60' | 'Limited Pay';
  incomePayoutOption: 'Advance' | 'Arrears';
  incomePayoutMode: 'Annual' | 'Semi Annual' | 'Quarterly' | 'Monthly';
  rider: string;

  // Personal Details
  name: string;
  mobileNo: string;
  alternateNo: string;
  email: string;
  dateOfBirth: string;
  education: string;
  occupation: 'Job' | 'Business' | 'Self Employed' | 'Student' | 'Housewife' | 'Other';
  organizationName: string;
  workBelongsTo: string;
  annualIncome: string;
  yearsOfWorking: string;
  currentAddress: string;
  permanentAddress: string;
  maritalStatus: 'Single' | 'Married';
  placeOfBirth: string;

  // Family Details
  fatherName: string;
  fatherAge: string;
  fatherStatus: 'Alive' | 'Dead';
  motherName: string;
  motherAge: string;
  motherStatus: 'Alive' | 'Dead';
  spouseName: string;
  spouseAge: string;
  nomineeName: string;
  nomineeRelation: string;
  nomineeDOB: string;

  // Insurance Details
  relationshipWithProposer: string;
  laName: string;
  laDob: string;
  age: string;
  heightFt: string;
  heightIn: string;
  weight: string;
  designation: string;
  existingPolicy: string;
  premiumAmount: string;
  remarks: string;

  // Proposer Documents
  proposerPanNumber: string;
  proposerPanPhoto: string;
  proposerAadharNumber: string;
  proposerAadharPhoto: string;
  proposerPhoto: string;
  proposerCancelledCheque: string;
  proposerBankStatement: string;
  proposerOtherDocument: string;

  // LA Documents
  laPanNumber: string;
  laPanPhoto: string;
  laAadharNumber: string;
  laAadharPhoto: string;
  laPhoto: string;
  laCancelledCheque: string;
  laBankStatement: string;
  laOtherDocument: string;
}

export default function LifeInsuranceVerificationPage() {
  const params = useParams();
  const [verification, setVerification] = useState<LifeInsuranceVerification | null>(null);
  const [editData, setEditData] = useState<LifeInsuranceVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ role: string } | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/check');
        if (!res.ok) throw new Error('Failed to fetch user');
        const data = await res.json();
        setCurrentUser(data.user);
      } catch (err) {
        setCurrentUser(null);
      }
    };
    fetchUser();
  }, []);

  const canEdit = ['admin', 'Payment_Coordinator', 'PLVC_verificator'].includes(currentUser?.role || '');

  useEffect(() => {
    const fetchVerificationDetails = async () => {
      try {
        const response = await fetch(`/api/leads/${params.id}/life-insurance`);
        if (!response.ok) {
          throw new Error('Failed to fetch verification details');
        }
        const result = await response.json();
        if (result.success && result.data) {
          setVerification(result.data);
          setEditData(result.data);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    fetchVerificationDetails();
  }, [params.id]);

  const handleFieldChange = (field: keyof LifeInsuranceVerification, value: any) => {
    if (!editData) return;
    setEditData({ ...editData, [field]: value });
  };

  const handleSave = async () => {
    if (!editData) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/leads/${params.id}/life-insurance`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      });
      if (!res.ok) throw new Error('Failed to update verification');
      const data = await res.json();
      setVerification(editData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setIsSaving(false);
    }
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

  const formatStatus = (status: string) => {
    switch (status) {
      case 'submitted': return 'Submitted';
      case 'processing': return 'Processing';
      case 'link_created': return 'Link Created';
      case 'payment_done': return 'Payment Done';
      case 'PLVC_verification': return 'PLVC Verification';
      case 'PLVC_done': return 'PLVC Done';
      default: return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }
  };

  const renderField = (label: string, value: any, type: 'text' | 'date' | 'boolean' = 'text') => {
    let displayValue = value;
    if (value !== undefined && value !== null) {
      switch (type) {
        case 'date':
          displayValue = new Date(value).toLocaleString();
          break;
        case 'boolean':
          displayValue = value ? 'Yes' : 'No';
          break;
        default:
          displayValue = value.toString();
      }
    }

    if (canEdit) {
      return (
        <div>
          <label className="block text-sm font-medium text-gray-500">{label}</label>
          <input
            type={type === 'date' ? 'datetime-local' : 'text'}
            value={value || ''}
            onChange={(e) => handleFieldChange(label.toLowerCase().replace(/\s+/g, '') as keyof LifeInsuranceVerification, e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
      );
    }

    return (
      <div>
        <label className="block text-sm font-medium text-gray-500">{label}</label>
        <p className="mt-1 text-sm text-gray-900">{displayValue}</p>
      </div>
    );
  };

  const renderDocumentLink = (url: string | undefined, label: string) => {
    if (!url) return null;
    return (
      <div className="mb-2">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 flex items-center"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          {label}
        </a>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  if (!verification) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded">
          No verification details found for this lead.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Life Insurance Verification Details</h1>
          <p className="text-gray-600 mt-2">
            Lead ID: {verification.leadId}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {canEdit && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          )}
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(verification.status)}`}>
            {formatStatus(verification.status)}
          </span>
          <Link
            href={`/leads/${params.id}`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Back to Lead
          </Link>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="p-6">
          <div className="grid grid-cols-1 gap-8">
            {/* Basic Information */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderField('Selected Company', verification.selectedCompany)}
                {renderField('Residential Status', verification.residentialStatus)}
                {renderField('Nationality', verification.nationality)}
                {renderField('Policy For', verification.policyFor)}
                {renderField('Created At', verification.createdAt, 'date')}
                {renderField('Last Updated', verification.updatedAt, 'date')}
              </div>
            </div>

            {/* Product Details */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Product Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderField('Product Name', verification.productName)}
                {renderField('PT', verification.pt)}
                {renderField('PPT', verification.ppt)}
                {renderField('Plan Variant', verification.planVariant)}
                {renderField('Premium', verification.premium)}
                {renderField('Smoker', verification.isSmoker)}
                {renderField('Mode of Payment', verification.modeOfPayment)}
                {renderField('Premium Payment Method', verification.premiumPaymentMethod)}
                {renderField('Income Payout Option', verification.incomePayoutOption)}
                {renderField('Income Payout Mode', verification.incomePayoutMode)}
                {renderField('Rider', verification.rider)}
              </div>
            </div>

            {/* Personal Details */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Personal Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderField('Name', verification.name)}
                {renderField('Mobile Number', verification.mobileNo)}
                {renderField('Alternate Number', verification.alternateNo)}
                {renderField('Email', verification.email)}
                {renderField('Date of Birth', verification.dateOfBirth, 'date')}
                {renderField('Education', verification.education)}
                {renderField('Occupation', verification.occupation)}
                {renderField('Organization Name', verification.organizationName)}
                {renderField('Work Belongs To', verification.workBelongsTo)}
                {renderField('Annual Income', verification.annualIncome)}
                {renderField('Years of Working', verification.yearsOfWorking)}
                {renderField('Marital Status', verification.maritalStatus)}
                {renderField('Place of Birth', verification.placeOfBirth)}
                <div className="md:col-span-3">
                  {renderField('Current Address', verification.currentAddress)}
                </div>
                <div className="md:col-span-3">
                  {renderField('Permanent Address', verification.permanentAddress)}
                </div>
              </div>
            </div>

            {/* Family Details */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Family Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderField('Father\'s Name', verification.fatherName)}
                {renderField('Father\'s Age', verification.fatherAge)}
                {renderField('Father\'s Status', verification.fatherStatus)}
                {renderField('Mother\'s Name', verification.motherName)}
                {renderField('Mother\'s Age', verification.motherAge)}
                {renderField('Mother\'s Status', verification.motherStatus)}
                {renderField('Spouse\'s Name', verification.spouseName)}
                {renderField('Spouse\'s Age', verification.spouseAge)}
                {renderField('Nominee Name', verification.nomineeName)}
                {renderField('Nominee Relation', verification.nomineeRelation)}
                {renderField('Nominee Date of Birth', verification.nomineeDOB, 'date')}
              </div>
            </div>

            {/* Insurance Details */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Insurance Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderField('Relationship With Proposer', verification.relationshipWithProposer)}
                {renderField('LA Name', verification.laName)}
                {renderField('LA Date of Birth', verification.laDob, 'date')}
                {renderField('Age', verification.age)}
                {renderField('Height (ft)', verification.heightFt)}
                {renderField('Height (inches)', verification.heightIn)}
                {renderField('Weight', verification.weight)}
                {renderField('Designation', verification.designation)}
                {renderField('Existing Policy', verification.existingPolicy)}
                {renderField('Premium Amount', verification.premiumAmount)}
                <div className="md:col-span-3">
                  {renderField('Remarks', verification.remarks)}
                </div>
              </div>
            </div>

            {/* Proposer Documents */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Proposer Documents</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderField('PAN Number', verification.proposerPanNumber)}
                {renderDocumentLink(verification.proposerPanPhoto, 'PAN Card')}
                {renderField('Aadhaar Number', verification.proposerAadharNumber)}
                {renderDocumentLink(verification.proposerAadharPhoto, 'Aadhaar Card')}
                {renderDocumentLink(verification.proposerPhoto, 'Photo')}
                {renderDocumentLink(verification.proposerCancelledCheque, 'Cancelled Cheque')}
                {renderDocumentLink(verification.proposerBankStatement, 'Bank Statement')}
                {renderDocumentLink(verification.proposerOtherDocument, 'Other Document')}
              </div>
            </div>

            {/* Life Assured (LA) Documents */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Life Assured (LA) Documents</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderField('PAN Number', verification.laPanNumber)}
                {renderDocumentLink(verification.laPanPhoto, 'PAN Card')}
                {renderField('Aadhaar Number', verification.laAadharNumber)}
                {renderDocumentLink(verification.laAadharPhoto, 'Aadhaar Card')}
                {renderDocumentLink(verification.laPhoto, 'Photo')}
                {renderDocumentLink(verification.laCancelledCheque, 'Cancelled Cheque')}
                {renderDocumentLink(verification.laBankStatement, 'Bank Statement')}
                {renderDocumentLink(verification.laOtherDocument, 'Other Document')}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
} 