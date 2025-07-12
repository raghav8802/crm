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
  incomePayoutOption: 'Advance' | 'Arrears' | 'None';
  incomePayoutMode: 'Annual' | 'Semi Annual' | 'Quarterly' | 'Monthly' | 'Lumpsum';
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

  // New Document Structure
  documents: {
    proposerDocuments: Array<{
      documentType: 'PAN' | 'Aadhaar' | 'Photo' | 'Cancelled Cheque' | 'Bank Statement' | 'Other';
      files: Array<{
        url: string;
        fileName: string;
      }>;
    }>;
    laDocuments: Array<{
      documentType: 'PAN' | 'Aadhaar' | 'Photo' | 'Cancelled Cheque' | 'Bank Statement' | 'Other';
      files: Array<{
        url: string;
        fileName: string;
      }>;
    }>;
  };

  paymentDocuments: Array<{
    documentType: 'Payment Screenshot' | 'BI File';
    files: Array<{
      url: string;
      fileName: string;
    }>;
  }>;

  verificationDocuments: Array<{
    documentType: 'Sales Audio' | 'Verification Call' | 'Welcome Call';
    files: Array<{
      fileType: 'audio' | 'video';
      url: string;
      fileName: string;
    }>;
  }>;

  // For search/filter
  panNumber: string;
  aadharNumber: string;
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
  const [paymentScreenshotUploading, setPaymentScreenshotUploading] = useState(false);
  const [biDocumentUploading, setBiDocumentUploading] = useState(false);
  const [plvcUploading, setPlvcUploading] = useState(false);
  const [welcomeCallUploading, setWelcomeCallUploading] = useState(false);
  const [salesCallUploading, setSalesCallUploading] = useState(false);
  const [deletingDocument, setDeletingDocument] = useState<string | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const paymentScreenshotRef = useRef<HTMLInputElement | null>(null);
  const biDocumentRef = useRef<HTMLInputElement | null>(null);
  const plvcInputRef = useRef<HTMLInputElement | null>(null);
  const welcomeCallInputRef = useRef<HTMLInputElement | null>(null);
  const salesCallInputRef = useRef<HTMLInputElement | null>(null);

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

  const renderDocumentGroup = (documents: any[], title: string, category: 'proposer' | 'la') => {
    if (!documents || documents.length === 0) {
      return (
        <div>
          <h3 className="text-md font-medium text-gray-700 mb-3">{title}</h3>
          <p className="text-sm text-gray-500">No documents uploaded yet</p>
        </div>
      );
    }

    return (
      <div>
        <h3 className="text-md font-medium text-gray-700 mb-3">{title}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {documents.map((docGroup, groupIndex) => (
            <div key={groupIndex} className="bg-gray-50 rounded-lg p-3">
              <h4 className="text-sm font-medium text-gray-600 mb-2">{docGroup.documentType}</h4>
              <div className="space-y-1">
                {docGroup.files.map((file: any, fileIndex: number) => (
                  <div key={fileIndex} className="flex items-center justify-between bg-white rounded p-2 text-xs">
                    <span className="text-gray-700 truncate mr-2">{file.fileName}</span>
                    <div className="flex gap-1">
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 flex-shrink-0"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </a>
                      <button
                        onClick={() => handleDeleteInitialDocument(category, docGroup.documentType, fileIndex)}
                        disabled={deletingDocument === `${category}-${docGroup.documentType}-${fileIndex}`}
                        className="text-red-600 hover:text-red-800 flex-shrink-0 disabled:opacity-50"
                      >
                        {deletingDocument === `${category}-${docGroup.documentType}-${fileIndex}` ? (
                          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
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
      formData.append('file', file);
      formData.append('type', 'payment');
      const res = await fetch(`/api/leads/${params.id}/life-insurance/payment-screenshot`, {
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
      formData.append('file', file);
      formData.append('type', 'bi');
      const res = await fetch(`/api/leads/${params.id}/life-insurance/payment-screenshot`, {
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

  // Delete document handler
  const handleDeleteDocument = async (documentType: 'Payment Screenshot' | 'BI File', fileIndex: number) => {
    const documentKey = `${documentType}-${fileIndex}`;
    setDeletingDocument(documentKey);
    setError(null);
    
    try {
      const res = await fetch(`/api/leads/${params.id}/life-insurance/delete-document?documentType=${encodeURIComponent(documentType)}&fileIndex=${fileIndex}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) throw new Error('Failed to delete document');
      
      const data = await res.json();
      if (data.success && data.data) {
        setVerification(data.data);
        setEditData(data.data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete document');
    } finally {
      setDeletingDocument(null);
    }
  };

  // Delete initial document handler
  const handleDeleteInitialDocument = async (category: 'proposer' | 'la', documentType: string, fileIndex: number) => {
    const documentKey = `${category}-${documentType}-${fileIndex}`;
    setDeletingDocument(documentKey);
    setError(null);
    
    try {
      const res = await fetch(`/api/leads/${params.id}/life-insurance/delete-initial-document?category=${category}&documentType=${encodeURIComponent(documentType)}&fileIndex=${fileIndex}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) throw new Error('Failed to delete document');
      
      const data = await res.json();
      if (data.success && data.data) {
        setVerification(data.data);
        setEditData(data.data);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete document');
    } finally {
      setDeletingDocument(null);
    }
  };

  // PLVC upload handler
  const handlePlvcUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = e.target.files;
    
    // Check file type
    const isVideo = files[0].type.startsWith('video/');
    const isAudio = files[0].type.startsWith('audio/');
    
    if (!isVideo && !isAudio) {
      setError('Please upload only MP4, MOV video files or MP3, WAV audio files');
      return;
    }
    
    if (files[0].size > 100 * 1024 * 1024) { // 100MB limit
      setError('File size should be less than 100MB');
      return;
    }
    
    setPlvcUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('media', files[i]);
        formData.append('type', 'plvc');
      }
      const res = await fetch(`/api/leads/${params.id}/life-insurance/plvc-video`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Failed to upload files');
      const data = await res.json();
      if (data.success && data.data) {
        setVerification(data.data);
        setEditData(data.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload files');
    } finally {
      setPlvcUploading(false);
      if (plvcInputRef.current) plvcInputRef.current.value = '';
    }
  };

  // Welcome Call upload handler
  const handleWelcomeCallUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = e.target.files;
    
    // Check file type
    const isVideo = files[0].type.startsWith('video/');
    const isAudio = files[0].type.startsWith('audio/');
    
    if (!isVideo && !isAudio) {
      setError('Please upload only MP4, MOV video files or MP3, WAV audio files');
      return;
    }
    
    if (files[0].size > 100 * 1024 * 1024) { // 100MB limit
      setError('File size should be less than 100MB');
      return;
    }
    
    setWelcomeCallUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('media', files[i]);
        formData.append('type', 'welcome');
      }
      const res = await fetch(`/api/leads/${params.id}/life-insurance/plvc-video`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Failed to upload files');
      const data = await res.json();
      if (data.success && data.data) {
        setVerification(data.data);
        setEditData(data.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload files');
    } finally {
      setWelcomeCallUploading(false);
      if (welcomeCallInputRef.current) welcomeCallInputRef.current.value = '';
    }
  };

  // Sales Call upload handler
  const handleSalesCallUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = e.target.files;
    
    // Check file type
    const isAudio = files[0].type.startsWith('audio/');
    
    if (!isAudio) {
      setError('Please upload only MP3, WAV audio files');
      return;
    }
    
    if (files[0].size > 100 * 1024 * 1024) { // 100MB limit
      setError('File size should be less than 100MB');
      return;
    }
    
    setSalesCallUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('media', files[i]);
        formData.append('type', 'sales');
      }
      const res = await fetch(`/api/leads/${params.id}/life-insurance/plvc-video`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Failed to upload files');
      const data = await res.json();
      if (data.success && data.data) {
        setVerification(data.data);
        setEditData(data.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload files');
    } finally {
      setSalesCallUploading(false);
      if (salesCallInputRef.current) salesCallInputRef.current.value = '';
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
              <div className="max-w-2xl">
                {renderDocumentGroup(editData?.documents?.proposerDocuments || [], 'Proposer Documents', 'proposer')}
              </div>
            </div>

            {/* Life Assured (LA) Documents */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Life Assured (LA) Documents</h2>
              <div className="max-w-2xl">
                {renderDocumentGroup(editData?.documents?.laDocuments || [], 'LA Documents', 'la')}
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

            {/* Payment Screenshot and BI Document Upload Section */}
            <div className="mt-6 border-t pt-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">Documents Upload</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
                {/* Payment Screenshot Section */}
                {editData?.status === 'payment_done' && (
                  <div>
                    <h4 className="text-md font-medium text-gray-700 mb-3">Payment Screenshot</h4>
                    {editData?.paymentDocuments?.find(doc => doc.documentType === 'Payment Screenshot') ? (
                      <div className="space-y-4">
                        {editData.paymentDocuments.find(doc => doc.documentType === 'Payment Screenshot')?.files.map((file, index) => (
                          <div key={index} className="bg-gray-50 rounded-lg p-3">
                            <img 
                              src={file.url} 
                              alt="Payment Screenshot"
                              className="max-w-full h-auto rounded-lg shadow-lg max-h-48 object-cover"
                            />
                            <div className="flex items-center justify-between mt-2">
                              <p className="text-xs text-gray-500 truncate mr-2">{file.fileName}</p>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => window.open(file.url, '_blank')}
                                  className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                >
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  View
                                </button>
                                <button
                                  onClick={handleChangeScreenshot}
                                  className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                >
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                  </svg>
                                  Change
                                </button>
                                <button
                                  onClick={() => handleDeleteDocument('Payment Screenshot', index)}
                                  disabled={deletingDocument === `Payment Screenshot-${index}`}
                                  className="inline-flex items-center px-2 py-1 border border-red-300 shadow-sm text-xs font-medium rounded-md text-red-700 bg-white hover:bg-red-50 disabled:opacity-50"
                                >
                                  {deletingDocument === `Payment Screenshot-${index}` ? (
                                    <svg className="animate-spin w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                  ) : (
                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  )}
                                  {deletingDocument === `Payment Screenshot-${index}` ? 'Deleting...' : 'Delete'}
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-300">
                          <div className="text-center">
                            <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <div className="mt-3">
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
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              >
                                {paymentScreenshotUploading ? 'Uploading...' : 'Upload Screenshot'}
                              </button>
                            </div>
                            <p className="mt-2 text-xs text-gray-500">
                              Upload payment screenshot (JPG, PNG, etc. - max 10MB)
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* BI Document Section */}
                {currentUser?.role === 'Payment_Coordinator' && editData?.status === 'link_created' && (
                  <div>
                    <h4 className="text-md font-medium text-gray-700 mb-3">BI Document</h4>
                    {editData?.paymentDocuments?.find(doc => doc.documentType === 'BI File') ? (
                      <div className="space-y-4">
                        {editData.paymentDocuments.find(doc => doc.documentType === 'BI File')?.files.map((file, index) => (
                          <div key={index} className="bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-2">
                                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                <span className="text-sm font-medium text-gray-700">BI Document</span>
                              </div>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => window.open(file.url, '_blank')}
                                  className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                >
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  View
                                </button>
                                <button
                                  onClick={handleChangeBiDocument}
                                  className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                >
                                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                  </svg>
                                  Change
                                </button>
                                <button
                                  onClick={() => handleDeleteDocument('BI File', index)}
                                  disabled={deletingDocument === `BI File-${index}`}
                                  className="inline-flex items-center px-2 py-1 border border-red-300 shadow-sm text-xs font-medium rounded-md text-red-700 bg-white hover:bg-red-50 disabled:opacity-50"
                                >
                                  {deletingDocument === `BI File-${index}` ? (
                                    <svg className="animate-spin w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                  ) : (
                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                  )}
                                  {deletingDocument === `BI File-${index}` ? 'Deleting...' : 'Delete'}
                                </button>
                              </div>
                            </div>
                            <div className="bg-white rounded-lg border border-gray-200 p-3">
                              <div className="aspect-[3/4] relative max-h-48">
                                <iframe 
                                  src={file.url}
                                  className="w-full h-full rounded-lg shadow-sm"
                                  title="BI Document"
                                />
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2 truncate">{file.fileName}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-300">
                          <div className="text-center">
                            <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                            <div className="mt-3">
                              <input
                                type="file"
                                accept=".pdf,image/*"
                                ref={biDocumentRef}
                                onChange={handleBiDocumentUpload}
                                disabled={biDocumentUploading}
                                className="hidden"
                              />
                              <button
                                onClick={handleChangeBiDocument}
                                disabled={biDocumentUploading}
                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                              >
                                {biDocumentUploading ? 'Uploading...' : 'Upload BI Document'}
                              </button>
                            </div>
                            <p className="mt-2 text-xs text-gray-500">
                              Upload BI document (PDF or image - max 10MB)
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              {error && <div className="text-red-600 mt-4 text-center">{error}</div>}
            </div>

            {/* PLVC Video/Audio Upload Section */}
            {(currentUser?.role === 'PLVC_verificator' && ['PLVC_verification', 'PLVC_done'].includes(editData?.status || '')) && (
              <div className="mt-8 border-t pt-8">
                <h2 className="text-lg font-semibold text-blue-900 mb-6">Call Recordings</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* PLVC Recordings */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <h3 className="text-md font-medium text-gray-700 mb-4">PLVC Recordings</h3>
                    <div className="space-y-4">
                      {editData?.verificationDocuments?.find(doc => doc.documentType === 'Verification Call')?.files && editData.verificationDocuments.find(doc => doc.documentType === 'Verification Call')!.files.length > 0 ? (
                        <div className="space-y-3">
                          {editData.verificationDocuments.find(doc => doc.documentType === 'Verification Call')!.files.map((file, index) => (
                            <div key={index} className="bg-gray-50 rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 truncate pr-2" title={file.fileName}>Recording {index + 1}</span>
                                <button
                                  onClick={() => window.open(file.url, '_blank')}
                                  className="text-blue-600 hover:text-blue-800 flex-shrink-0"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 text-center">No PLVC recordings uploaded yet</p>
                      )}
                      <div className="mt-4">
                        <input
                          type="file"
                          accept="video/mp4,video/quicktime,audio/mp3,audio/wav,audio/mpeg"
                          ref={plvcInputRef}
                          onChange={handlePlvcUpload}
                          disabled={plvcUploading}
                          multiple
                          className="hidden"
                        />
                        <button
                          onClick={() => plvcInputRef.current?.click()}
                          disabled={plvcUploading}
                          className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          {plvcUploading ? 'Uploading...' : 'Add PLVC Recording'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Welcome Call Recordings */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <h3 className="text-md font-medium text-gray-700 mb-4">Welcome Call Recordings</h3>
                    <div className="space-y-4">
                      {editData?.verificationDocuments?.find(doc => doc.documentType === 'Welcome Call')?.files && editData.verificationDocuments.find(doc => doc.documentType === 'Welcome Call')!.files.length > 0 ? (
                        <div className="space-y-3">
                          {editData.verificationDocuments.find(doc => doc.documentType === 'Welcome Call')!.files.map((file, index) => (
                            <div key={index} className="bg-gray-50 rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 truncate pr-2" title={file.fileName}>Recording {index + 1}</span>
                                <button
                                  onClick={() => window.open(file.url, '_blank')}
                                  className="text-blue-600 hover:text-blue-800 flex-shrink-0"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 text-center">No welcome call recordings uploaded yet</p>
                      )}
                      <div className="mt-4">
                        <input
                          type="file"
                          accept="video/mp4,video/quicktime,audio/mp3,audio/wav,audio/mpeg"
                          ref={welcomeCallInputRef}
                          onChange={handleWelcomeCallUpload}
                          disabled={welcomeCallUploading}
                          multiple
                          className="hidden"
                        />
                        <button
                          onClick={() => welcomeCallInputRef.current?.click()}
                          disabled={welcomeCallUploading}
                          className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          {welcomeCallUploading ? 'Uploading...' : 'Add Welcome Call Recording'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Sales Call Recordings */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <h3 className="text-md font-medium text-gray-700 mb-4">Sales Call Recordings</h3>
                    <div className="space-y-4">
                      {editData?.verificationDocuments?.find(doc => doc.documentType === 'Sales Audio')?.files && editData.verificationDocuments.find(doc => doc.documentType === 'Sales Audio')!.files.length > 0 ? (
                        <div className="space-y-3">
                          {editData.verificationDocuments.find(doc => doc.documentType === 'Sales Audio')!.files.map((file, index) => (
                            <div key={index} className="bg-gray-50 rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600 truncate pr-2" title={file.fileName}>Recording {index + 1}</span>
                                <button
                                  onClick={() => window.open(file.url, '_blank')}
                                  className="text-blue-600 hover:text-blue-800 flex-shrink-0"
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 text-center">No sales call recordings uploaded yet</p>
                      )}
                      <div className="mt-4">
                        <input
                          type="file"
                          accept="audio/mp3,audio/wav,audio/mpeg"
                          ref={salesCallInputRef}
                          onChange={handleSalesCallUpload}
                          disabled={salesCallUploading}
                          multiple
                          className="hidden"
                        />
                        <button
                          onClick={() => salesCallInputRef.current?.click()}
                          disabled={salesCallUploading}
                          className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          {salesCallUploading ? 'Uploading...' : 'Add Sales Call Recording'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                {error && <div className="text-red-600 mt-4 text-center">{error}</div>}
              </div>
            )}
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
    </div>
  );
} 