'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface TermInsuranceVerification {
  _id: string;
  leadId: string;
  insuranceType: 'term_insurance';
  status: 'submitted' | 'processing' | 'link_created' | 'payment_done' | 'PLVC_verification' | 'PLVC_done';
  createdAt: string;
  updatedAt: string;
  paymentScreenshot?: string;
  
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
  sumAssured: string;
  isSmoker: 'Yes' | 'No';
  modeOfPayment: 'Annual' | 'Semi Annual' | 'Quarterly' | 'Monthly';
  premiumPaymentMethod: 'Single' | 'Regular' | 'Pay Till 60' | 'Limited Pay';
  
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

  // Life Assured Details
  laProposal: string;
  laName: string;
  laDob: string;
  age: string;
  heightFt: string;
  heightIn: string;
  weight: string;
  designation: string;
  existingPolicy: string;
  premiumAmount: string;
  remarks: Array<{
    text: string;
    user: string;
    timestamp: Date;
  }>;

  // Documents
  panNumber: string;
  panPhoto: string;
  aadharNumber: string;
  aadharPhoto: string;
  userPhoto: string;
  cancelledCheque: string;
  bankStatement: string;
  otherDocument: string;

  // PLVC Video (optional, for PLVC_done)
  plvcVideo?: string;
}

export default function TermInsuranceVerificationPage() {
  const params = useParams();
  const [verification, setVerification] = useState<TermInsuranceVerification | null>(null);
  const [editData, setEditData] = useState<TermInsuranceVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ role: string } | null>(null);
  const [editStatus, setEditStatus] = useState<TermInsuranceVerification['status']>('submitted');
  const [newRemark, setNewRemark] = useState('');
  const [paymentScreenshotUploading, setPaymentScreenshotUploading] = useState(false);
  const paymentScreenshotRef = useRef<HTMLInputElement | null>(null);

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

  useEffect(() => {
    const fetchVerificationDetails = async () => {
      try {
        const response = await fetch(`/api/leads/${params.id}/term-insurance`);
        if (!response.ok) {
          throw new Error('Failed to fetch verification details');
        }
        const result = await response.json();
        if (result.success && result.data) {
          setVerification(result.data);
          setEditStatus(result.data.status as TermInsuranceVerification['status'] || 'submitted');
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

  const canEdit = ['admin', 'Payment_Coordinator', 'PLVC_verificator'].includes(currentUser?.role || '');

  const handleFieldChange = (field: keyof TermInsuranceVerification, value: any) => {
    if (!editData) return;
    setEditData({ ...editData, [field]: value });
  };

  const handleSave = async () => {
    if (!editData) return;
    setIsSaving(true);
    try {
      let payload: any = { ...editData };
      payload.status = editStatus;
      if (newRemark.trim()) {
        payload.newRemark = {
          text: newRemark.trim(),
          user: currentUser?.role || 'unknown',
          timestamp: new Date().toISOString()
        };
      }
      const res = await fetch(`/api/leads/${params.id}/term-insurance`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to update verification');
      const data = await res.json();
      setVerification(data.data);
      setEditData(data.data);
      setNewRemark('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    } finally {
      setIsSaving(false);
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    if (file.type !== 'video/mp4' && file.type !== 'video/quicktime') {
      alert('Please upload only MP4 or MOV video files');
      return;
    }
    if (file.size > 100 * 1024 * 1024) { // 100MB limit
      alert('Video file size should be less than 100MB');
      return;
    }
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('video', file);
      const res = await fetch(`/api/leads/${params.id}/term-insurance/video`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Failed to upload video');
      const data = await res.json();
      if (editData) {
        setEditData({ ...editData, plvcVideo: data.videoUrl });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload video');
    } finally {
      setIsSaving(false);
    }
  };

  // Payment Screenshot upload handler
  const handlePaymentScreenshotUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload only image files (JPG, PNG, etc.)');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('File size should be less than 10MB');
      return;
    }
    
    setPaymentScreenshotUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('screenshot', file);
      const res = await fetch(`/api/leads/${params.id}/term-insurance/payment-screenshot`, {
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
      setPaymentScreenshotUploading(false);
      if (paymentScreenshotRef.current) paymentScreenshotRef.current.value = '';
    }
  };

  const handleChangeScreenshot = () => {
    if (paymentScreenshotRef.current) {
      paymentScreenshotRef.current.click();
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
    value: any,
    type: 'text' | 'date' | 'boolean' = 'text',
    key?: keyof TermInsuranceVerification
  ) => {
    let displayValue = '-';
    let inputValue = value || '';
    if (value !== undefined && value !== null) {
      switch (type) {
        case 'date':
          inputValue = value ? new Date(value).toISOString().slice(0, 10) : '';
          displayValue = value ? new Date(value).toLocaleDateString() : '-';
          break;
        case 'boolean':
          displayValue = value ? 'Yes' : 'No';
          break;
        default:
          displayValue = value.toString();
      }
    }
    return (
      <div>
        <label className="block text-sm font-medium text-gray-500">{label}</label>
        {canEdit && key ? (
          <input
            type={type}
            value={inputValue}
            onChange={e => handleFieldChange(key, e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        ) : (
          <p className="mt-1 text-sm text-gray-900">{displayValue}</p>
        )}
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

  const renderVideoUpload = () => {
    if (!verification || currentUser?.role !== 'PLVC_verificator' || verification.status !== 'PLVC_done') {
      return null;
    }
    return (
      <div className="mt-6 border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">PLVC Verification Video</h3>
        {verification.plvcVideo ? (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <video 
                controls 
                className="w-full max-w-3xl mx-auto rounded-lg shadow-lg"
                src={verification.plvcVideo}
              >
                Your browser does not support the video tag.
              </video>
            </div>
            <div className="flex items-center justify-between max-w-3xl mx-auto">
              <p className="text-sm text-gray-500">
                Video uploaded successfully
              </p>
              <button
                onClick={() => window.open(verification.plvcVideo, '_blank')}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Open Video
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
                    accept="video/mp4,video/quicktime"
                    onChange={handleVideoUpload}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100"
                  />
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Upload MP4 or MOV video file (max 100MB)
                </p>
              </div>
            </div>
          </div>
        )}
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
          <h1 className="text-2xl font-bold text-gray-900">Term Insurance Verification Details</h1>
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
                {renderField('Selected Company', editData?.selectedCompany, 'text', 'selectedCompany')}
                {renderField('Residential Status', editData?.residentialStatus, 'text', 'residentialStatus')}
                {renderField('Nationality', editData?.nationality, 'text', 'nationality')}
                {renderField('Policy For', editData?.policyFor, 'text', 'policyFor')}
                {renderField('Created At', editData?.createdAt, 'date', 'createdAt')}
                {renderField('Last Updated', editData?.updatedAt, 'date', 'updatedAt')}
              </div>
            </div>

            {/* Product Details */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Product Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderField('Product Name', editData?.productName, 'text', 'productName')}
                {renderField('PT', editData?.pt, 'text', 'pt')}
                {renderField('PPT', editData?.ppt, 'text', 'ppt')}
                {renderField('Plan Variant', editData?.planVariant, 'text', 'planVariant')}
                {renderField('Sum Assured', editData?.sumAssured, 'text', 'sumAssured')}
                {renderField('Smoker', editData?.isSmoker, 'text', 'isSmoker')}
                {renderField('Mode of Payment', editData?.modeOfPayment, 'text', 'modeOfPayment')}
                {renderField('Premium Payment Method', editData?.premiumPaymentMethod, 'text', 'premiumPaymentMethod')}
              </div>
            </div>

            {/* Personal Details */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Personal Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderField('Name', editData?.name, 'text', 'name')}
                {renderField('Mobile Number', editData?.mobileNo, 'text', 'mobileNo')}
                {renderField('Alternate Number', editData?.alternateNo, 'text', 'alternateNo')}
                {renderField('Email', editData?.email, 'text', 'email')}
                {renderField('Date of Birth', editData?.dateOfBirth, 'date', 'dateOfBirth')}
                {renderField('Education', editData?.education, 'text', 'education')}
                {renderField('Occupation', editData?.occupation, 'text', 'occupation')}
                {renderField('Organization Name', editData?.organizationName, 'text', 'organizationName')}
                {renderField('Work Belongs To', editData?.workBelongsTo, 'text', 'workBelongsTo')}
                {renderField('Annual Income', editData?.annualIncome, 'text', 'annualIncome')}
                {renderField('Years of Working', editData?.yearsOfWorking, 'text', 'yearsOfWorking')}
                {renderField('Marital Status', editData?.maritalStatus, 'text', 'maritalStatus')}
                {renderField('Place of Birth', editData?.placeOfBirth, 'text', 'placeOfBirth')}
                <div className="md:col-span-3">
                  {renderField('Current Address', editData?.currentAddress, 'text', 'currentAddress')}
                </div>
                <div className="md:col-span-3">
                  {renderField('Permanent Address', editData?.permanentAddress, 'text', 'permanentAddress')}
                </div>
              </div>
            </div>

            {/* Family Details */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Family Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderField('Father\'s Name', editData?.fatherName, 'text', 'fatherName')}
                {renderField('Father\'s Age', editData?.fatherAge, 'text', 'fatherAge')}
                {renderField('Father\'s Status', editData?.fatherStatus, 'text', 'fatherStatus')}
                {renderField('Mother\'s Name', editData?.motherName, 'text', 'motherName')}
                {renderField('Mother\'s Age', editData?.motherAge, 'text', 'motherAge')}
                {renderField('Mother\'s Status', editData?.motherStatus, 'text', 'motherStatus')}
                {renderField('Spouse\'s Name', editData?.spouseName, 'text', 'spouseName')}
                {renderField('Spouse\'s Age', editData?.spouseAge, 'text', 'spouseAge')}
                {renderField('Nominee Name', editData?.nomineeName, 'text', 'nomineeName')}
                {renderField('Nominee Relation', editData?.nomineeRelation, 'text', 'nomineeRelation')}
                {renderField('Nominee Date of Birth', editData?.nomineeDOB, 'date', 'nomineeDOB')}
              </div>
            </div>

            {/* Life Assured Details */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Life Assured Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderField('LA Proposal', editData?.laProposal, 'text', 'laProposal')}
                {renderField('LA Name', editData?.laName, 'text', 'laName')}
                {renderField('LA Date of Birth', editData?.laDob, 'date', 'laDob')}
                {renderField('Age', editData?.age, 'text', 'age')}
                {renderField('Height (ft)', editData?.heightFt, 'text', 'heightFt')}
                {renderField('Height (inches)', editData?.heightIn, 'text', 'heightIn')}
                {renderField('Weight', editData?.weight, 'text', 'weight')}
                {renderField('Designation', editData?.designation, 'text', 'designation')}
                {renderField('Existing Policy', editData?.existingPolicy, 'text', 'existingPolicy')}
                {renderField('Premium Amount', editData?.premiumAmount, 'text', 'premiumAmount')}
                <div className="md:col-span-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Remarks</label>
                    <div className="space-y-2 max-h-40 overflow-y-auto mb-2 bg-gray-50 rounded p-2 border border-gray-200">
                      {Array.isArray(verification.remarks) && verification.remarks.length > 0 ? (
                        verification.remarks.map((remark, idx) => (
                          <div key={idx} className="bg-white rounded p-2 text-xs text-gray-700 border border-gray-100">
                            <div className="font-semibold">{remark.user}</div>
                            <div>{remark.text}</div>
                            <div className="text-gray-400 text-[10px]">{remark.timestamp ? new Date(remark.timestamp).toLocaleString() : ''}</div>
                          </div>
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

            {/* Documents */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Documents</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-3">Document Numbers</h3>
                  <div className="space-y-3">
                    {renderField('PAN Number', editData?.panNumber, 'text', 'panNumber')}
                    {renderField('Aadhaar Number', editData?.aadharNumber, 'text', 'aadharNumber')}
                  </div>
                </div>
                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-3">Uploaded Documents</h3>
                  <div className="space-y-3">
                    {renderDocumentLink(verification.panPhoto, 'PAN Card')}
                    {renderDocumentLink(verification.aadharPhoto, 'Aadhaar Card')}
                    {renderDocumentLink(verification.userPhoto, 'Photo')}
                    {renderDocumentLink(verification.cancelledCheque, 'Cancelled Cheque')}
                    {renderDocumentLink(verification.bankStatement, 'Bank Statement')}
                    {renderDocumentLink(verification.otherDocument, 'Other Document')}
                  </div>
                </div>
              </div>
            </div>

            {/* PLVC Video Section */}
            {verification.plvcVideo && (
              <div className="mt-8">
                <h2 className="text-lg font-medium text-gray-900 mb-4">PLVC Verification Video</h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  <video
                    controls
                    className="w-full max-w-3xl mx-auto rounded-lg shadow-lg"
                    src={verification.plvcVideo}
                  >
                    Your browser does not support the video tag.
                  </video>
                  <div className="flex items-center justify-between max-w-3xl mx-auto mt-2">
                    <button
                      onClick={() => window.open(verification.plvcVideo, '_blank')}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Open Video
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Status and Save Button */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Status & Remark</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Status</label>
                  {canEdit ? (
                    <select
                      value={editStatus}
                      onChange={e => setEditStatus(e.target.value as TermInsuranceVerification['status'])}
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
                  {/* Remarks already handled above */}
                </div>
              </div>

              {/* Payment Screenshot Upload Section */}
              {editStatus === 'payment_done' && (
                <div className="mt-6 border-t pt-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-4">Payment Screenshot</h3>
                  {verification?.paymentScreenshot ? (
                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <img 
                          src={verification.paymentScreenshot} 
                          alt="Payment Screenshot"
                          className="max-w-full h-auto rounded-lg shadow-lg"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-500">
                          Payment screenshot uploaded successfully
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => window.open(verification.paymentScreenshot, '_blank')}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                          >
                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View Screenshot
                          </button>
                          <button
                            onClick={handleChangeScreenshot}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                          >
                            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Change Screenshot
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 max-w-3xl mx-auto">
                      <div className="bg-gray-50 rounded-lg p-6 border-2 border-dashed border-gray-300">
                        <div className="text-center">
                          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <div className="mt-4">
                            <input
                              type="file"
                              accept="image/*"
                              ref={paymentScreenshotRef}
                              onChange={handlePaymentScreenshotUpload}
                              disabled={paymentScreenshotUploading}
                              className="hidden"
                            />
                            <button
                              onClick={handleChangeScreenshot}
                              disabled={paymentScreenshotUploading}
                              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              {paymentScreenshotUploading ? 'Uploading...' : 'Upload Screenshot'}
                            </button>
                          </div>
                          <p className="mt-2 text-sm text-gray-500">
                            Upload payment screenshot (JPG, PNG, etc. - max 10MB)
                          </p>
                          {error && <div className="text-red-600 mt-2">{error}</div>}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {canEdit && (
                <div className="fixed bottom-8 right-8 z-50">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="inline-flex items-center px-6 py-3 border border-blue-600 rounded-md shadow-lg text-base font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
} 