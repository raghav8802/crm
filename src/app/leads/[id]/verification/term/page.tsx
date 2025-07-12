'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface File {
  url: string;
  fileName: string;
}

interface VerificationFile extends File {
  fileType: 'audio' | 'video';
}

interface DocumentGroup {
  documentType: string;
  files: File[];
}

interface VerificationDocumentGroup {
  documentType: string;
  files: VerificationFile[];
}

interface TermInsuranceVerification {
  _id: string;
  leadId: string;
  insuranceType: 'term_insurance';
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
  aadharNumber: string;
  documents: DocumentGroup[];
  paymentDocuments: DocumentGroup[];
  verificationDocuments: VerificationDocumentGroup[];
}

export default function TermInsuranceVerificationPage() {
  const params = useParams();
  const [verification, setVerification] = useState<TermInsuranceVerification | null>(null);
  const [editData, setEditData] = useState<TermInsuranceVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ role: string } | null>(null);
  const [newRemark, setNewRemark] = useState('');
  const [paymentScreenshotUploading, setPaymentScreenshotUploading] = useState(false);
  const paymentScreenshotRef = useRef<HTMLInputElement | null>(null);
  const [plvcUploading, setPlvcUploading] = useState(false);
  const [welcomeCallUploading, setWelcomeCallUploading] = useState(false);
  const [salesCallUploading, setSalesCallUploading] = useState(false);
  const plvcInputRef = useRef<HTMLInputElement | null>(null);
  const welcomeCallInputRef = useRef<HTMLInputElement | null>(null);
  const salesCallInputRef = useRef<HTMLInputElement | null>(null);
  const [biDocumentUploading, setBiDocumentUploading] = useState(false);
  const biDocumentRef = useRef<HTMLInputElement | null>(null);
  const [documentUploading, setDocumentUploading] = useState<{[key: string]: boolean}>({});
  const documentInputRefs = useRef<{[key: string]: HTMLInputElement | null}>({});

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
      const res = await fetch(`/api/leads/${params.id}/term-insurance/plvc-video`, {
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
      const res = await fetch(`/api/leads/${params.id}/term-insurance/plvc-video`, {
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
    
    setSalesCallUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append('media', files[i]);
        formData.append('type', 'sales');
      }
      const res = await fetch(`/api/leads/${params.id}/term-insurance/plvc-video`, {
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
      const res = await fetch(`/api/leads/${params.id}/term-insurance/bi-document`, {
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

  const handleDeleteDocument = async (documentType: string, fileIndex: number) => {
    if (!editData) return;
    
    try {
      const res = await fetch(`/api/leads/${params.id}/term-insurance/delete-document`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentType, fileIndex }),
      });
      
      if (!res.ok) throw new Error('Failed to delete document');
      const data = await res.json();
      if (data.success && data.data) {
        setVerification(data.data);
        setEditData(data.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete document');
    }
  };

  const handleReuploadDocument = async (e: React.ChangeEvent<HTMLInputElement>, documentType: string, fileIndex: number) => {
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
    
    setDocumentUploading(prev => ({ ...prev, [`${documentType}-${fileIndex}`]: true }));
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('documentType', documentType);
      formData.append('fileIndex', fileIndex.toString());
      
      const res = await fetch(`/api/leads/${params.id}/term-insurance/reupload-document`, {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) throw new Error('Failed to reupload document');
      const data = await res.json();
      if (data.success && data.data) {
        setVerification(data.data);
        setEditData(data.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reupload document');
    } finally {
      setDocumentUploading(prev => ({ ...prev, [`${documentType}-${fileIndex}`]: false }));
      if (documentInputRefs.current[`${documentType}-${fileIndex}`]) {
        documentInputRefs.current[`${documentType}-${fileIndex}`]!.value = '';
      }
    }
  };

  const handleChangeDocument = (documentType: string, fileIndex: number) => {
    const key = `${documentType}-${fileIndex}`;
    if (documentInputRefs.current[key]) {
      documentInputRefs.current[key]!.click();
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

  const renderCallRecordings = () => {
    if (!verification || currentUser?.role !== 'PLVC_verificator' || !['PLVC_verification', 'PLVC_done'].includes(verification.status)) {
      return null;
    }

    const plvcFiles = editData?.verificationDocuments?.find(doc => doc.documentType === 'Verification Call')?.files ?? [];
    const welcomeFiles = editData?.verificationDocuments?.find(doc => doc.documentType === 'Welcome Call')?.files ?? [];
    const salesFiles = editData?.verificationDocuments?.find(doc => doc.documentType === 'Sales Audio')?.files ?? [];

    return (
      <div className="mt-8 border-t pt-8">
        <h2 className="text-lg font-semibold text-blue-900 mb-6">Call Recordings</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* PLVC Recordings */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <h3 className="text-md font-medium text-gray-700 mb-4">PLVC Recordings</h3>
            <div className="space-y-4">
              {plvcFiles.length > 0 ? (
                <div className="space-y-3">
                  {plvcFiles.map((video, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 truncate pr-2" title={video.fileName}>Recording {index + 1}</span>
                        <button
                          onClick={() => window.open(video.url, '_blank')}
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
              {welcomeFiles.length > 0 ? (
                <div className="space-y-3">
                  {welcomeFiles.map((video, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 truncate pr-2" title={video.fileName}>Recording {index + 1}</span>
                        <button
                          onClick={() => window.open(video.url, '_blank')}
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
                  accept="audio/mp3,audio/wav,audio/mpeg"
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
              {salesFiles.length > 0 ? (
                <div className="space-y-3">
                  {salesFiles.map((video, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 truncate pr-2" title={video.fileName}>Recording {index + 1}</span>
                        <button
                          onClick={() => window.open(video.url, '_blank')}
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

  const paymentScreenshotDoc = editData?.paymentDocuments?.find(d => d.documentType === 'Payment Screenshot')?.files[0];
  const biDocumentDoc = editData?.paymentDocuments?.find(d => d.documentType === 'BI File')?.files[0];

  const allDocuments = [
    ...(editData?.documents || []),
    ...(editData?.paymentDocuments || [])
  ];

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
                      {Array.isArray(editData?.remarks) && editData?.remarks.length > 0 ? (
                        editData?.remarks.map((remark, idx) => (
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
                    {allDocuments.map(docGroup =>
                      docGroup.files.map((file, index) => (
                        <div key={`${docGroup.documentType}-${index}`} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <a
                              href={file.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 flex items-center"
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              {file.fileName || `${docGroup.documentType} ${docGroup.files.length > 1 ? index + 1 : ''}`.trim()}
                            </a>
                  </div>
                          {canEdit && (
                            <div className="flex gap-2 ml-4">
                              <input
                                type="file"
                                accept="image/*,.pdf"
                                ref={el => { documentInputRefs.current[`${docGroup.documentType}-${index}`] = el; }}
                                onChange={e => handleReuploadDocument(e, docGroup.documentType, index)}
                                disabled={documentUploading[`${docGroup.documentType}-${index}`]}
                                className="hidden"
                              />
                              <button
                                onClick={() => handleChangeDocument(docGroup.documentType, index)}
                                disabled={documentUploading[`${docGroup.documentType}-${index}`]}
                                className="inline-flex items-center px-2 py-1 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                                title="Re-upload"
                              >
                                {documentUploading[`${docGroup.documentType}-${index}`] ? (
                                  'Uploading...'
                                ) : (
                                  <>
                                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    Re-upload
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => handleDeleteDocument(docGroup.documentType, index)}
                                className="inline-flex items-center px-2 py-1 border border-red-300 shadow-sm text-xs font-medium rounded text-red-700 bg-white hover:bg-red-50"
                                title="Delete"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* PLVC Video Section */}
            {renderCallRecordings()}

            {/* Status and Save Button */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Status & Remark</h2>
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
                    <p className="mt-1 text-sm text-gray-900">{editData?.status}</p>
                  )}
                </div>
                <div>
                  {/* Remarks already handled above */}
                </div>
              </div>

              {/* BI Document Upload Section for Link Created Status */}
              {editData?.status === 'link_created' && (
                <div className="mt-6 border-t pt-6">
                  <div className="grid grid-cols-1 gap-6">
                    {/* BI Document */}
                    <div>
                      <h3 className="text-lg font-semibold text-blue-900 mb-4">BI Document</h3>
                      {biDocumentDoc ? (
                        <div className="space-y-4">
                          <div className="bg-gray-50 rounded-lg p-4">
                            {biDocumentDoc.url.endsWith('.pdf') ? (
                              <div className="aspect-[3/4] bg-white rounded-lg shadow-lg flex items-center justify-center">
                                <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                              </div>
                            ) : (
                              <img 
                                src={biDocumentDoc.url} 
                                alt="BI Document"
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
                                onClick={() => window.open(biDocumentDoc.url, '_blank')}
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
              {editData?.status === 'payment_done' && (
                <div className="mt-6 border-t pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Payment Screenshot */}
                    <div>
                      <h3 className="text-lg font-semibold text-blue-900 mb-4">Payment Screenshot</h3>
                      {paymentScreenshotDoc ? (
                        <div className="space-y-4">
                          <div className="bg-gray-50 rounded-lg p-4">
                            <img 
                              src={paymentScreenshotDoc.url} 
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
                                onClick={() => window.open(paymentScreenshotDoc.url, '_blank')}
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
                      {biDocumentDoc ? (
                        <div className="space-y-4">
                          <div className="bg-gray-50 rounded-lg p-4">
                            {biDocumentDoc.url.endsWith('.pdf') ? (
                              <div className="aspect-[3/4] bg-white rounded-lg shadow-lg flex items-center justify-center">
                                <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                              </div>
                            ) : (
                              <img 
                                src={biDocumentDoc.url} 
                                alt="BI Document"
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
                                onClick={() => window.open(biDocumentDoc.url, '_blank')}
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