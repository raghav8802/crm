'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface Remark {
  text: string;
  user: string;
  timestamp: string;
}

interface InsuredPerson {
  name: string;
  dob: string;
  gender: string;
  relationship: string;
  height: string;
  weight: string;
  aadharNumber: string;
  aadharPhoto: string;
  medicalHistory: string;
  preExistingDisease: string;
  bpDiabetes: string;
  currentProblems: string;
  disclosureDate: string;
  medicineName: string;
  medicineDose: string;
  drinking: 'Yes' | 'No';
  smoking: 'Yes' | 'No';
  chewing: 'Yes' | 'No';
  medicalDocuments: string[];
}

interface HealthInsuranceVerification {
  _id: string;
  leadId: string;
  insuranceType: 'health_insurance';
  status: 'submitted' | 'processing' | 'link_created' | 'payment_done' | 'PLVC_verification' | 'PLVC_done';
  createdAt: string;
  updatedAt: string;

  // Company Selection
  selectedCompany: string;

  // Policy Details
  manufacturerName: string;
  planName: string;
  premium: string;
  ptPpt: string;
  mode: string;
  portFresh: string;
  sumInsured: string;
  sumInsuredType: string;
  rider: string;

  // Proposer Details
  proposerName: string;
  proposerMobile: string;
  proposerEmail: string;
  proposerAddress: string;
  proposerAnnualIncome: string;
  proposerPanNumber: string;
  proposerPanImage: string;
  proposerHeight: string;
  proposerWeight: string;

  // Insured Persons
  insuredPersons: InsuredPerson[];

  // Nominee Details
  nomineeName: string;
  nomineeRelation: string;
  nomineeDOB: string;

  remarks?: Remark[];

  // PLVC Video
  plvcVideo?: string;

  // Payment Screenshot
  paymentScreenshot?: string;
}

export default function HealthInsuranceVerificationPage() {
  const params = useParams();
  const [verification, setVerification] = useState<HealthInsuranceVerification | null>(null);
  const [editData, setEditData] = useState<HealthInsuranceVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ role: string } | null>(null);
  const [editStatus, setEditStatus] = useState<HealthInsuranceVerification['status']>('submitted');
  const [newRemark, setNewRemark] = useState('');
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const [videoUploading, setVideoUploading] = useState(false);
  const paymentScreenshotRef = useRef<HTMLInputElement | null>(null);
  const [paymentScreenshotUploading, setPaymentScreenshotUploading] = useState(false);

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
        const response = await fetch(`/api/leads/${params.id}/health-insurance`);
        if (!response.ok) {
          throw new Error('Failed to fetch verification details');
        }
        const result = await response.json();
        if (result.success && result.data) {
          setVerification(result.data);
          setEditData(result.data);
          setEditStatus(result.data.status || 'submitted');
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

  const handleFieldChange = (field: string, value: any) => {
    if (!editData) return;

    // Handle nested fields (like insuredPersons.0.name)
    if (field.includes('.')) {
      const [parent, index, child] = field.split('.');
      const newEditData = { ...editData };
      if (parent === 'insuredPersons') {
        const newInsuredPersons = [...(editData.insuredPersons || [])];
        newInsuredPersons[parseInt(index)] = {
          ...newInsuredPersons[parseInt(index)],
          [child]: value
        };
        newEditData.insuredPersons = newInsuredPersons;
      }
      setEditData(newEditData);
    } else {
      // Handle regular fields
      setEditData({
        ...editData,
        [field]: value
      });
    }
  };

  const handleSave = async () => {
    if (!editData) return;
    setIsSaving(true);
    try {
      let payload: any = {};
      
      // Only include changed fields
      Object.keys(editData).forEach(key => {
        if (JSON.stringify(editData[key as keyof HealthInsuranceVerification]) !== 
            JSON.stringify(verification?.[key as keyof HealthInsuranceVerification])) {
          payload[key] = editData[key as keyof HealthInsuranceVerification];
        }
      });

      // Always include status if it's changed
      if (editStatus !== verification?.status) {
        payload.status = editStatus;
      }

      // Add new remark if exists
      if (newRemark.trim()) {
        payload.newRemark = {
          text: newRemark.trim(),
          user: currentUser?.role || 'unknown',
          timestamp: new Date().toISOString(),
        };
      }

      const res = await fetch(`/api/leads/${params.id}/health-insurance`, {
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

  const renderField = (label: string, value: any, type: 'text' | 'date' | 'boolean' = 'text', key?: string) => {
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
      const res = await fetch(`/api/leads/${params.id}/health-insurance/plvc-video`, {
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
      const res = await fetch(`/api/leads/${params.id}/health-insurance/payment-screenshot`, {
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
          <h1 className="text-2xl font-bold text-gray-900">Health Insurance Verification Details</h1>
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
        <div className="p-6 space-y-10">
          {/* Company & Policy Details */}
          <div>
            <h2 className="text-lg font-semibold text-blue-900 mb-4 border-b pb-2">Company & Policy Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {renderField('Selected Company', editData?.selectedCompany, 'text', 'selectedCompany')}
              {renderField('Manufacturer Name', editData?.manufacturerName, 'text', 'manufacturerName')}
              {renderField('Plan Name', editData?.planName, 'text', 'planName')}
              {renderField('Premium', editData?.premium, 'text', 'premium')}
              {renderField('PT/PPT', editData?.ptPpt, 'text', 'ptPpt')}
              {renderField('Mode', editData?.mode, 'text', 'mode')}
              {renderField('Port/Fresh', editData?.portFresh, 'text', 'portFresh')}
              {renderField('Sum Insured', editData?.sumInsured, 'text', 'sumInsured')}
              {renderField('Sum Insured Type', editData?.sumInsuredType, 'text', 'sumInsuredType')}
              {renderField('Rider', editData?.rider, 'text', 'rider')}
              {renderField('Created At', editData?.createdAt, 'date')}
              {renderField('Last Updated', editData?.updatedAt, 'date')}
            </div>
          </div>

          {/* Proposer Details */}
          <div>
            <h2 className="text-lg font-semibold text-blue-900 mb-4 border-b pb-2">Proposer Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {renderField('Name', editData?.proposerName, 'text', 'proposerName')}
              {renderField('Mobile', editData?.proposerMobile, 'text', 'proposerMobile')}
              {renderField('Email', editData?.proposerEmail, 'text', 'proposerEmail')}
              {renderField('Annual Income', editData?.proposerAnnualIncome, 'text', 'proposerAnnualIncome')}
              {renderField('Height', editData?.proposerHeight, 'text', 'proposerHeight')}
              {renderField('Weight', editData?.proposerWeight, 'text', 'proposerWeight')}
              {renderField('PAN Number', editData?.proposerPanNumber, 'text', 'proposerPanNumber')}
              {renderDocumentLink(editData?.proposerPanImage, 'PAN Card')}
              <div className="md:col-span-3">
                {renderField('Address', editData?.proposerAddress, 'text', 'proposerAddress')}
              </div>
            </div>
          </div>

          {/* Insured Persons */}
          <div>
            <h2 className="text-lg font-semibold text-blue-900 mb-4 border-b pb-2">Insured Persons</h2>
            {editData?.insuredPersons && editData.insuredPersons.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {editData.insuredPersons.map((person, idx) => (
                  <div key={idx} className="mb-6 p-4 border rounded-lg bg-gray-50">
                    <h3 className="font-semibold text-gray-800 mb-2">Insured Person {idx + 1}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {renderField('Name', person.name, 'text', `insuredPersons.${idx}.name`)}
                      {renderField('DOB', person.dob, 'date', `insuredPersons.${idx}.dob`)}
                      {renderField('Gender', person.gender, 'text', `insuredPersons.${idx}.gender`)}
                      {renderField('Relationship', person.relationship, 'text', `insuredPersons.${idx}.relationship`)}
                      {renderField('Height', person.height, 'text', `insuredPersons.${idx}.height`)}
                      {renderField('Weight', person.weight, 'text', `insuredPersons.${idx}.weight`)}
                      {renderField('Aadhar Number', person.aadharNumber, 'text', `insuredPersons.${idx}.aadharNumber`)}
                      {renderDocumentLink(person.aadharPhoto, 'Aadhar Photo')}
                      {renderField('Medical History', person.medicalHistory, 'text', `insuredPersons.${idx}.medicalHistory`)}
                      {renderField('Pre-existing Disease', person.preExistingDisease, 'text', `insuredPersons.${idx}.preExistingDisease`)}
                      {renderField('BP/Diabetes', person.bpDiabetes, 'text', `insuredPersons.${idx}.bpDiabetes`)}
                      {renderField('Current Problems', person.currentProblems, 'text', `insuredPersons.${idx}.currentProblems`)}
                      {renderField('Disclosure Date', person.disclosureDate, 'date', `insuredPersons.${idx}.disclosureDate`)}
                      {renderField('Medicine Name', person.medicineName, 'text', `insuredPersons.${idx}.medicineName`)}
                      {renderField('Medicine Dose', person.medicineDose, 'text', `insuredPersons.${idx}.medicineDose`)}
                      {renderField('Drinking', person.drinking, 'text', `insuredPersons.${idx}.drinking`)}
                      {renderField('Smoking', person.smoking, 'text', `insuredPersons.${idx}.smoking`)}
                      {renderField('Chewing', person.chewing, 'text', `insuredPersons.${idx}.chewing`)}
                    </div>
                    <div className="mt-2">
                      <h4 className="font-medium text-gray-700 mb-1">Medical Documents</h4>
                      {person.medicalDocuments && person.medicalDocuments.length > 0 ? (
                        <ul className="list-disc ml-6">
                          {person.medicalDocuments.map((doc, docIdx) => (
                            <li key={docIdx}>
                              {renderDocumentLink(doc, `Medical Document ${docIdx + 1}`)}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-gray-500">No medical documents uploaded.</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-gray-500">No insured persons added.</span>
            )}
          </div>

          {/* Nominee Details */}
          <div>
            <h2 className="text-lg font-semibold text-blue-900 mb-4 border-b pb-2">Nominee Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {renderField('Nominee Name', editData?.nomineeName, 'text', 'nomineeName')}
              {renderField('Nominee Relation', editData?.nomineeRelation, 'text', 'nomineeRelation')}
              {renderField('Nominee DOB', editData?.nomineeDOB, 'date', 'nomineeDOB')}
            </div>
          </div>

          {/* Status and Remarks Section */}
          <div>
            <h2 className="text-lg font-semibold text-blue-900 mb-4 border-b pb-2">Status & Remarks</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500">Status</label>
                {canEdit ? (
                  <select
                    value={editStatus}
                    onChange={e => setEditStatus(e.target.value as HealthInsuranceVerification['status'])}
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
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
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

          {/* PLVC Video/Audio Upload Section */}
          {(currentUser?.role === 'PLVC_verificator' && editStatus === 'PLVC_done') && (
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
      </div>
    </div>
  );
} 