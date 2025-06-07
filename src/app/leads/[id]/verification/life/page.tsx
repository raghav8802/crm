'use client';

import { useState, useEffect, useRef } from 'react';
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

  plvcVideo?: string;
}

export default function LifeInsuranceVerificationPage() {
  const params = useParams();
  const [verification, setVerification] = useState<LifeInsuranceVerification | null>(null);
  const [editData, setEditData] = useState<LifeInsuranceVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ role: string } | null>(null);
  const [newRemark, setNewRemark] = useState('');
  const [videoUploading, setVideoUploading] = useState(false);
  const videoInputRef = useRef<HTMLInputElement | null>(null);

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
      let payload: any = { ...editData };
      
      // Add new remark if exists
      if (newRemark.trim()) {
        const currentRemarks = editData.remarks ? `${editData.remarks}\n` : '';
        payload.remarks = `${currentRemarks}[${new Date().toLocaleString()}] ${currentUser?.role || 'unknown'}: ${newRemark.trim()}`;
      }

      const res = await fetch(`/api/leads/${params.id}/life-insurance`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to update verification');
      
      const data = await res.json();
      if (data.success && data.data) {
        setVerification(data.data);
        setEditData(data.data);
        setNewRemark('');
      } else {
        throw new Error('Invalid response format');
      }
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

  const renderField = (
    label: string,
    fieldName: keyof LifeInsuranceVerification,
    value: any,
    type: 'text' | 'date' | 'boolean' = 'text'
  ) => {
    let displayValue = '-';
    let inputValue = value || '';

    if (value !== undefined && value !== null) {
      switch (type) {
        case 'date':
          try {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
              displayValue = date.toLocaleDateString();
              inputValue = date.toISOString().split('T')[0];
            }
          } catch (e) {
            console.error('Error parsing date:', e);
          }
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
            type={type === 'date' ? 'date' : 'text'}
            value={inputValue}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
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

  // Video/Audio upload handler (with validation)
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    // Check file type
    const isVideo = file.type.startsWith('video/');
    const isAudio = file.type.startsWith('audio/');
    
    if (!isVideo && !isAudio) {
      setError('Please upload only MP4, MOV video files or MP3, WAV audio files');
      return;
    }
    
    if (file.size > 100 * 1024 * 1024) { // 100MB limit
      setError('File size should be less than 100MB');
      return;
    }
    
    setVideoUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('media', file);
      const res = await fetch(`/api/leads/${params.id}/life-insurance/plvc-video`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Failed to upload file');
      const data = await res.json();
      if (data.success && data.data) {
        setVerification(data.data);
        setEditData(data.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
    } finally {
      setVideoUploading(false);
      if (videoInputRef.current) videoInputRef.current.value = '';
    }
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
                {renderField('Selected Company', 'selectedCompany', editData?.selectedCompany)}
                {renderField('Residential Status', 'residentialStatus', editData?.residentialStatus)}
                {renderField('Nationality', 'nationality', editData?.nationality)}
                {renderField('Policy For', 'policyFor', editData?.policyFor)}
                {renderField('Created At', 'createdAt', editData?.createdAt, 'date')}
                {renderField('Last Updated', 'updatedAt', editData?.updatedAt, 'date')}
              </div>
            </div>

            {/* Product Details */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Product Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderField('Product Name', 'productName', editData?.productName)}
                {renderField('PT', 'pt', editData?.pt)}
                {renderField('PPT', 'ppt', editData?.ppt)}
                {renderField('Plan Variant', 'planVariant', editData?.planVariant)}
                {renderField('Premium', 'premium', editData?.premium)}
                {renderField('Smoker', 'isSmoker', editData?.isSmoker)}
                {renderField('Mode of Payment', 'modeOfPayment', editData?.modeOfPayment)}
                {renderField('Premium Payment Method', 'premiumPaymentMethod', editData?.premiumPaymentMethod)}
                {renderField('Income Payout Option', 'incomePayoutOption', editData?.incomePayoutOption)}
                {renderField('Income Payout Mode', 'incomePayoutMode', editData?.incomePayoutMode)}
                {renderField('Rider', 'rider', editData?.rider)}
              </div>
            </div>

            {/* Personal Details */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Personal Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderField('Name', 'name', editData?.name)}
                {renderField('Mobile Number', 'mobileNo', editData?.mobileNo)}
                {renderField('Alternate Number', 'alternateNo', editData?.alternateNo)}
                {renderField('Email', 'email', editData?.email)}
                {renderField('Date of Birth', 'dateOfBirth', editData?.dateOfBirth, 'date')}
                {renderField('Education', 'education', editData?.education)}
                {renderField('Occupation', 'occupation', editData?.occupation)}
                {renderField('Organization Name', 'organizationName', editData?.organizationName)}
                {renderField('Work Belongs To', 'workBelongsTo', editData?.workBelongsTo)}
                {renderField('Annual Income', 'annualIncome', editData?.annualIncome)}
                {renderField('Years of Working', 'yearsOfWorking', editData?.yearsOfWorking)}
                {renderField('Marital Status', 'maritalStatus', editData?.maritalStatus)}
                {renderField('Place of Birth', 'placeOfBirth', editData?.placeOfBirth)}
                <div className="md:col-span-3">
                  {renderField('Current Address', 'currentAddress', editData?.currentAddress)}
                </div>
                <div className="md:col-span-3">
                  {renderField('Permanent Address', 'permanentAddress', editData?.permanentAddress)}
                </div>
              </div>
            </div>

            {/* Family Details */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Family Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderField('Father\'s Name', 'fatherName', editData?.fatherName)}
                {renderField('Father\'s Age', 'fatherAge', editData?.fatherAge)}
                {renderField('Father\'s Status', 'fatherStatus', editData?.fatherStatus)}
                {renderField('Mother\'s Name', 'motherName', editData?.motherName)}
                {renderField('Mother\'s Age', 'motherAge', editData?.motherAge)}
                {renderField('Mother\'s Status', 'motherStatus', editData?.motherStatus)}
                {renderField('Spouse\'s Name', 'spouseName', editData?.spouseName)}
                {renderField('Spouse\'s Age', 'spouseAge', editData?.spouseAge)}
                {renderField('Nominee Name', 'nomineeName', editData?.nomineeName)}
                {renderField('Nominee Relation', 'nomineeRelation', editData?.nomineeRelation)}
                {renderField('Nominee Date of Birth', 'nomineeDOB', editData?.nomineeDOB, 'date')}
              </div>
            </div>

            {/* Insurance Details */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Insurance Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderField('Relationship With Proposer', 'relationshipWithProposer', editData?.relationshipWithProposer)}
                {renderField('LA Name', 'laName', editData?.laName)}
                {renderField('LA Date of Birth', 'laDob', editData?.laDob, 'date')}
                {renderField('Age', 'age', editData?.age)}
                {renderField('Height (ft)', 'heightFt', editData?.heightFt)}
                {renderField('Height (inches)', 'heightIn', editData?.heightIn)}
                {renderField('Weight', 'weight', editData?.weight)}
                {renderField('Designation', 'designation', editData?.designation)}
                {renderField('Existing Policy', 'existingPolicy', editData?.existingPolicy)}
                {renderField('Premium Amount', 'premiumAmount', editData?.premiumAmount)}
                <div className="md:col-span-3">
                  {renderField('Remarks', 'remarks', editData?.remarks)}
                </div>
              </div>
            </div>

            {/* Proposer Documents */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Proposer Documents</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderField('PAN Number', 'proposerPanNumber', editData?.proposerPanNumber)}
                {renderDocumentLink(editData?.proposerPanPhoto, 'PAN Card')}
                {renderField('Aadhaar Number', 'proposerAadharNumber', editData?.proposerAadharNumber)}
                {renderDocumentLink(editData?.proposerAadharPhoto, 'Aadhaar Card')}
                {renderDocumentLink(editData?.proposerPhoto, 'Photo')}
                {renderDocumentLink(editData?.proposerCancelledCheque, 'Cancelled Cheque')}
                {renderDocumentLink(editData?.proposerBankStatement, 'Bank Statement')}
                {renderDocumentLink(editData?.proposerOtherDocument, 'Other Document')}
              </div>
            </div>

            {/* Life Assured (LA) Documents */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Life Assured (LA) Documents</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderField('PAN Number', 'laPanNumber', editData?.laPanNumber)}
                {renderDocumentLink(editData?.laPanPhoto, 'PAN Card')}
                {renderField('Aadhaar Number', 'laAadharNumber', editData?.laAadharNumber)}
                {renderDocumentLink(editData?.laAadharPhoto, 'Aadhaar Card')}
                {renderDocumentLink(editData?.laPhoto, 'Photo')}
                {renderDocumentLink(editData?.laCancelledCheque, 'Cancelled Cheque')}
                {renderDocumentLink(editData?.laBankStatement, 'Bank Statement')}
                {renderDocumentLink(editData?.laOtherDocument, 'Other Document')}
              </div>
            </div>

            {/* Status & Remarks Section */}
            <div className="mt-8">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Status & Remarks</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Status</label>
                  {canEdit ? (
                    <select
                      value={editData?.status || ''}
                      onChange={e => handleFieldChange('status', e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                      <option value="submitted">Submitted</option>
                      <option value="processing">Processing</option>
                      <option value="link_created">Link Created</option>
                      <option value="payment_done">Payment Done</option>
                      <option value="PLVC_verification">PLVC Verification</option>
                      <option value="PLVC_done">PLVC Done</option>
                    </select>
                  ) : (
                    <p className="mt-1 text-sm text-gray-900">{verification.status}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Remarks</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto mb-2 bg-gray-50 rounded p-2 border border-gray-200">
                    {verification.remarks ? (
                      verification.remarks.split('\n').map((remark, idx) => (
                        remark.trim() && (
                          <div key={idx} className="bg-white rounded p-2 text-xm text-gray-700 border border-gray-100">
                            <div>{remark}</div>
                          </div>
                        )
                      ))
                    ) : (
                      <div className="text-gray-400">No remarks yet.</div>
                    )}
                  </div>
                  {canEdit && (
                    <>
                      <hr className="my-2" />
                      <textarea
                        value={newRemark}
                        onChange={e => setNewRemark(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        rows={2}
                        placeholder="Add a new remark..."
                      />
                    </>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {canEdit && (
        <div className="fixed bottom-8 right-8 z-50">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-lg text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Save Changes
              </>
            )}
          </button>
        </div>
      )}

      {/* PLVC Video/Audio Upload Section */}
      {(currentUser?.role === 'PLVC_verificator' && editData?.status === 'PLVC_done') && (
        <div className="mt-8 border-t pt-8">
          <h2 className="text-lg font-semibold text-blue-900 mb-4 border-b pb-2">PLVC Verification Media</h2>
          {verification?.plvcVideo ? (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                {verification.plvcVideo.match(/\.(mp4|mov)$/i) ? (
                  <video 
                    controls 
                    className="w-full max-w-3xl mx-auto rounded-lg shadow-lg"
                    src={verification.plvcVideo}
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <audio 
                    controls 
                    className="w-full max-w-3xl mx-auto rounded-lg shadow-lg"
                    src={verification.plvcVideo}
                  >
                    Your browser does not support the audio tag.
                  </audio>
                )}
              </div>
              <div className="flex items-center justify-between max-w-3xl mx-auto">
                <p className="text-sm text-gray-500">
                  {verification.plvcVideo.match(/\.(mp4|mov)$/i) ? 'Video' : 'Audio'} uploaded successfully
                </p>
                <button
                  onClick={() => window.open(verification.plvcVideo, '_blank')}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Open {verification.plvcVideo.match(/\.(mp4|mov)$/i) ? 'Video' : 'Audio'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 max-w-3xl mx-auto">
              <div className="bg-gray-50 rounded-lg p-6 border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
                  </svg>
                  <div className="mt-4">
                    <input
                      type="file"
                      accept="video/mp4,video/quicktime,audio/mp3,audio/wav,audio/mpeg"
                      ref={videoInputRef}
                      onChange={handleVideoUpload}
                      disabled={videoUploading}
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-md file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100"
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Upload MP4, MOV video files or MP3, WAV audio files (max 100MB)
                  </p>
                  {videoUploading && <div className="text-blue-600 mt-2">Uploading...</div>}
                  {error && <div className="text-red-600 mt-2">{error}</div>}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 