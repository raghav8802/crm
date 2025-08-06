'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface CarInsuranceVerification {
  _id: string;
  leadId: string;
  insuranceType: 'car_insurance';
  status: 'submitted' | 'processing' | 'link_created' | 'payment_done' | 'PLVC_verification' | 'PLVC_done';
  createdAt: string;
  updatedAt: string;
  paymentScreenshot?: string;
  biDocument?: string;  // New field for BI document

  // Company Selection
  selectedCompany: string;

  // Vehicle Details
  vehicleType: string;
  policyCover: string;
  registrationNumber: string;
  registrationMonth: string;
  registrationYear: string;
  vehicleBrand: string;
  fuelType: string;
  vehicleVariant: string;
  city: string;
  pincode: string;
  isBharatSeries: boolean;
  hasPreviousClaim: string;

  // Previous Policy Details
  previousPolicyType: 'used_vehicle' | 'name_transfer' | 'unknown' | 'none';
  previousPolicyExpiryDate: string;
  existingPolicyNCB: string;
  previousInsurerName: string;

  // Documents
  panCard: string;
  aadharCard: string;
  rcCopy: string;
  policyCopy: string;
  plvcVideo?: string;  // New field for PLVC video

  // New fields
  remarks?: string;

  // Policy Management (Payment Coordinator Fields)
  policyIssueDate?: string;
  renewalType?: 'Monthly' | 'Quarterly' | 'Half Yearly' | 'Yearly';
}

export default function CarInsuranceVerificationPage() {
  const params = useParams();
  const [verification, setVerification] = useState<CarInsuranceVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ role: string } | null>(null);
  const [editStatus, setEditStatus] = useState<CarInsuranceVerification['status']>('submitted');
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState<CarInsuranceVerification | null>(null);
  const [newRemark, setNewRemark] = useState('');
  const [paymentScreenshotUploading, setPaymentScreenshotUploading] = useState(false);
  const paymentScreenshotRef = useRef<HTMLInputElement | null>(null);
  const [biDocumentUploading, setBiDocumentUploading] = useState(false);
  const biDocumentRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/check');
        if (!res.ok) throw new Error('Failed to fetch user');
        const data = await res.json();
        setCurrentUser(data.user);
      } catch {
        setCurrentUser(null);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const fetchVerificationDetails = async () => {
      try {
        const response = await fetch(`/api/leads/${params.id}/car-insurance`);
        if (!response.ok) {
          throw new Error('Failed to fetch verification details');
        }
        const result = await response.json();
        if (result.success && result.data) {
          setVerification(result.data);
          setEditStatus(result.data.status as CarInsuranceVerification['status'] || 'submitted');
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

  const handleFieldChange = (field: keyof CarInsuranceVerification, value: any) => {
    if (!editData) return;
    setEditData({ ...editData, [field]: value });
  };

  const prepareDataForSave = (data: CarInsuranceVerification) => {
    const toISO = (d: any) => d ? new Date(d).toISOString() : undefined;
    return {
      ...data,
      createdAt: toISO(data.createdAt),
      updatedAt: toISO(data.updatedAt),
      previousPolicyExpiryDate: toISO(data.previousPolicyExpiryDate),
      isBharatSeries: typeof data.isBharatSeries === 'string'
        ? data.isBharatSeries === 'true' || data.isBharatSeries === 'Yes'
        : !!data.isBharatSeries,
    };
  };

  const handleSave = async () => {
    if (!editData) return;
    
    // Validate mandatory fields for Payment Coordinator
    if (currentUser?.role === 'Payment_Coordinator') {
      if (!editData.policyIssueDate) {
        setError('Policy Issue Date is mandatory for Payment Coordinators');
        return;
      }
      if (!editData.renewalType) {
        setError('Renewal Type is mandatory for Payment Coordinators');
        return;
      }
    }
    
    setIsSaving(true);
    setError(null);
    try {
      const payload: any = {
        ...prepareDataForSave(editData),
        status: editStatus,
        ...(newRemark.trim() && {
          newRemark: {
            text: newRemark.trim(),
            user: currentUser?.role || 'unknown',
            timestamp: new Date().toISOString(),
          }
        })
      };
      const res = await fetch(`/api/leads/${params.id}/car-insurance`, {
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
    // Allow video and audio files
    const allowedVideoTypes = ['video/mp4', 'video/quicktime', 'video/avi', 'video/mov'];
    const allowedAudioTypes = ['audio/mp3', 'audio/wav', 'audio/m4a', 'audio/aac', 'audio/ogg'];
    
    if (!allowedVideoTypes.includes(file.type) && !allowedAudioTypes.includes(file.type)) {
      alert('Please upload only MP4, MOV, AVI video files or MP3, WAV, M4A, AAC, OGG audio files');
      return;
    }

    if (file.size > 100 * 1024 * 1024) { // 100MB limit
      alert('File size should be less than 100MB');
      return;
    }

    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('video', file);

      const res = await fetch(`/api/leads/${params.id}/car-insurance/video`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Failed to upload file');
      
      const data = await res.json();
      if (editData) {
        setEditData({ ...editData, plvcVideo: data.videoUrl });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file');
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
      const res = await fetch(`/api/leads/${params.id}/car-insurance/payment-screenshot`, {
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

  // BI Document upload handler
  const handleBiDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    // Check file type
    if (!file.type.startsWith('image/') && !file.type.startsWith('application/pdf')) {
      setError('Please upload only image files (JPG, PNG) or PDF files');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('File size should be less than 10MB');
      return;
    }
    
    setBiDocumentUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('document', file);
      const res = await fetch(`/api/leads/${params.id}/car-insurance/bi-document`, {
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
      setBiDocumentUploading(false);
      if (biDocumentRef.current) biDocumentRef.current.value = '';
    }
  };

  const handleChangeBiDocument = () => {
    if (biDocumentRef.current) {
      biDocumentRef.current.click();
    }
  };

  const renderVideoUpload = () => {
    if (!verification || currentUser?.role !== 'PLVC_verificator' || verification.status !== 'PLVC_done') {
      return null;
    }

    return (
      <div className="mt-6 border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">PLVC Verification Media</h3>
        {verification.plvcVideo ? (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              {/* Check if it's a video or audio file */}
              {verification.plvcVideo.match(/\.(mp4|mov|avi|webm)$/i) ? (
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
                Media file uploaded successfully
              </p>
              <button
                onClick={() => window.open(verification.plvcVideo, '_blank')}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Open Media
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 max-w-3xl mx-auto">
            <div className="bg-gray-50 rounded-lg p-6 border-2 border-dashed border-gray-300">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-2 2v14a1 1 0 001 1z" />
                </svg>
                <div className="mt-4">
                  <input
                    type="file"
                    accept="video/mp4,video/quicktime,video/avi,video/mov,audio/mp3,audio/wav,audio/m4a,audio/aac,audio/ogg"
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
                  Upload video (MP4, MOV, AVI) or audio (MP3, WAV, M4A, AAC, OGG) file (max 100MB)
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
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
    key?: keyof CarInsuranceVerification
  ) => {
    let displayValue = '-';
    let inputValue = value || '';
    if (value !== undefined && value !== null) {
      switch (type) {
        case 'date':
          // Format for input type='date'
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
          <h1 className="text-2xl font-bold text-gray-900">Car Insurance Verification Details</h1>
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
            {/* Company Selection */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Company Selection</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderField('Selected Company', editData?.selectedCompany, 'text', 'selectedCompany')}
                {renderField('Created At', editData?.createdAt, 'date', 'createdAt')}
                {renderField('Last Updated', editData?.updatedAt, 'date', 'updatedAt')}
              </div>
            </div>

            {/* Vehicle Details */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Vehicle Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderField('Vehicle Type', editData?.vehicleType, 'text', 'vehicleType')}
                {renderField('Policy Cover', editData?.policyCover, 'text', 'policyCover')}
                {renderField('Registration Number', editData?.registrationNumber, 'text', 'registrationNumber')}
                {renderField('Registration Month', editData?.registrationMonth, 'text', 'registrationMonth')}
                {renderField('Registration Year', editData?.registrationYear, 'text', 'registrationYear')}
                {renderField('Vehicle Brand', editData?.vehicleBrand, 'text', 'vehicleBrand')}
                {renderField('Fuel Type', editData?.fuelType, 'text', 'fuelType')}
                {renderField('Vehicle Variant', editData?.vehicleVariant, 'text', 'vehicleVariant')}
                {renderField('City', editData?.city, 'text', 'city')}
                {renderField('Pincode', editData?.pincode, 'text', 'pincode')}
                {renderField('Is Bharat Series', editData?.isBharatSeries, 'boolean', 'isBharatSeries')}
                {renderField('Previous Claim', editData?.hasPreviousClaim, 'text', 'hasPreviousClaim')}
              </div>
            </div>

            {/* Previous Policy Details */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Previous Policy Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderField('Previous Policy Type', editData?.previousPolicyType, 'text', 'previousPolicyType')}
                {renderField('Previous Policy Expiry Date', editData?.previousPolicyExpiryDate, 'date', 'previousPolicyExpiryDate')}
                {renderField('Existing Policy NCB (%)', editData?.existingPolicyNCB, 'text', 'existingPolicyNCB')}
                {renderField('Previous Insurer Name', editData?.previousInsurerName, 'text', 'previousInsurerName')}
              </div>
            </div>

            {/* Documents */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Documents</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {renderDocumentLink(verification.panCard, 'PAN Card')}
                {renderDocumentLink(verification.aadharCard, 'Aadhar Card')}
                {renderDocumentLink(verification.rcCopy, 'RC Copy')}
                {renderDocumentLink(verification.policyCopy, 'Previous Policy Copy')}
              </div>
            </div>

            {/* Policy Management (Payment Coordinator Section) */}
            {currentUser?.role === 'Payment_Coordinator' && (
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">Policy Management</h2>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800 mb-3">
                    <strong>Payment Coordinator Required Fields:</strong> Please fill in the policy issue date and renewal type.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {renderField('Policy Issue Date', editData?.policyIssueDate, 'date', 'policyIssueDate')}
                  <div>
                    <label className="block text-sm font-medium text-gray-500">Renewal Type *</label>
                    {canEdit ? (
                      <select
                        value={editData?.renewalType || ''}
                        onChange={e => handleFieldChange('renewalType', e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select Renewal Type</option>
                        <option value="Monthly">Monthly</option>
                        <option value="Quarterly">Quarterly</option>
                        <option value="Half Yearly">Half Yearly</option>
                        <option value="Yearly">Yearly</option>
                      </select>
                    ) : (
                      <p className="mt-1 text-sm text-gray-900">{editData?.renewalType || 'Not set'}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Status and Remark (Editable for allowed roles) */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Status & Remark</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Status</label>
                  {canEdit ? (
                    <select
                      value={editStatus}
                      onChange={e => setEditStatus(e.target.value as CarInsuranceVerification['status'])}
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
                  <label className="block text-sm font-medium text-gray-500">Remarks</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto mb-2">
                    {Array.isArray(verification.remarks) && verification.remarks.length > 0 ? (
                      verification.remarks.map((remark, idx) => (
                        <div key={idx} className="bg-gray-50 rounded p-2 text-xs text-gray-700 border border-gray-200">
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
                    <textarea
                      value={newRemark}
                      onChange={e => setNewRemark(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      rows={2}
                      placeholder="Add a new remark..."
                    />
                  )}
                </div>
              </div>

              {/* BI Document Upload Section for Link Created Status */}
              {editStatus === 'link_created' && (
                <div className="mt-6 border-t pt-6">
                  <div className="grid grid-cols-1 gap-6">
                    {/* BI Document */}
                    <div>
                      <h3 className="text-lg font-semibold text-blue-900 mb-4">BI Document</h3>
                      {verification?.biDocument ? (
                        <div className="space-y-4">
                          <div className="bg-gray-50 rounded-lg p-4">
                            {verification.biDocument.endsWith('.pdf') ? (
                              <div className="aspect-[3/4] bg-white rounded-lg shadow-lg flex items-center justify-center">
                                <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                              </div>
                            ) : (
                              <Image 
                                src={verification.biDocument} 
                                alt="BI Document"
                                width={400}
                                height={300}
                                className="max-w-full h-auto rounded-lg shadow-lg"
                              />
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-500">
                              BI document uploaded successfully
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => window.open(verification.biDocument, '_blank')}
                                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                              >
                                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                View Document
                              </button>
                              <button
                                onClick={handleChangeBiDocument}
                                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                              >
                                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Change Document
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="bg-gray-50 rounded-lg p-6 border-2 border-dashed border-gray-300">
                            <div className="text-center">
                              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                              <div className="mt-4">
                                <input
                                  type="file"
                                  accept="image/*,.pdf"
                                  ref={biDocumentRef}
                                  onChange={handleBiDocumentUpload}
                                  disabled={biDocumentUploading}
                                  className="hidden"
                                />
                                <button
                                  onClick={handleChangeBiDocument}
                                  disabled={biDocumentUploading}
                                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                  {biDocumentUploading ? 'Uploading...' : 'Upload BI Document'}
                                </button>
                              </div>
                              <p className="mt-2 text-sm text-gray-500">
                                Upload BI document (JPG, PNG, PDF - max 10MB)
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  {error && <div className="text-red-600 mt-4 text-center">{error}</div>}
                </div>
              )}

              {/* Payment Screenshot and BI Document Upload Section for Payment Done Status */}
              {editStatus === 'payment_done' && (
                <div className="mt-6 border-t pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Payment Screenshot */}
                    <div>
                      <h3 className="text-lg font-semibold text-blue-900 mb-4">Payment Screenshot</h3>
                      {verification?.paymentScreenshot ? (
                        <div className="space-y-4">
                          <div className="bg-gray-50 rounded-lg p-4">
                            <Image 
                              src={verification.paymentScreenshot} 
                              alt="Payment Screenshot"
                              width={400}
                              height={300}
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
                        <div className="space-y-4">
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
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* BI Document */}
                    <div>
                      <h3 className="text-lg font-semibold text-blue-900 mb-4">BI Document</h3>
                      {verification?.biDocument ? (
                        <div className="space-y-4">
                          <div className="bg-gray-50 rounded-lg p-4">
                            {verification.biDocument.endsWith('.pdf') ? (
                              <div className="aspect-[3/4] bg-white rounded-lg shadow-lg flex items-center justify-center">
                                <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                              </div>
                            ) : (
                              <Image 
                                src={verification.biDocument} 
                                alt="BI Document"
                                width={400}
                                height={300}
                                className="max-w-full h-auto rounded-lg shadow-lg"
                              />
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-500">
                              BI document uploaded successfully
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => window.open(verification.biDocument, '_blank')}
                                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                              >
                                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                View Document
                              </button>
                              <button
                                onClick={handleChangeBiDocument}
                                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                              >
                                <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Change Document
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="bg-gray-50 rounded-lg p-6 border-2 border-dashed border-gray-300">
                            <div className="text-center">
                              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                              </svg>
                              <div className="mt-4">
                                <input
                                  type="file"
                                  accept="image/*,.pdf"
                                  ref={biDocumentRef}
                                  onChange={handleBiDocumentUpload}
                                  disabled={biDocumentUploading}
                                  className="hidden"
                                />
                                <button
                                  onClick={handleChangeBiDocument}
                                  disabled={biDocumentUploading}
                                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                  {biDocumentUploading ? 'Uploading...' : 'Upload BI Document'}
                                </button>
                              </div>
                              <p className="mt-2 text-sm text-gray-500">
                                Upload BI document (JPG, PNG, PDF - max 10MB)
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  {error && <div className="text-red-600 mt-4 text-center">{error}</div>}
                </div>
              )}

              {canEdit && (
                <button
                  onClick={handleSave}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              )}
              {renderVideoUpload()}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
