'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

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
}

export default function HealthInsuranceVerificationPage() {
  const params = useParams();
  const [verification, setVerification] = useState<HealthInsuranceVerification | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    let displayValue = '-';
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
        <div className="p-6">
          <div className="grid grid-cols-1 gap-8">
            {/* Company & Policy Details */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Company & Policy Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderField('Selected Company', verification.selectedCompany)}
                {renderField('Manufacturer Name', verification.manufacturerName)}
                {renderField('Plan Name', verification.planName)}
                {renderField('Premium', verification.premium)}
                {renderField('PT/PPT', verification.ptPpt)}
                {renderField('Mode', verification.mode)}
                {renderField('Port/Fresh', verification.portFresh)}
                {renderField('Sum Insured', verification.sumInsured)}
                {renderField('Sum Insured Type', verification.sumInsuredType)}
                {renderField('Rider', verification.rider)}
                {renderField('Created At', verification.createdAt, 'date')}
                {renderField('Last Updated', verification.updatedAt, 'date')}
              </div>
            </div>

            {/* Proposer Details */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Proposer Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderField('Name', verification.proposerName)}
                {renderField('Mobile', verification.proposerMobile)}
                {renderField('Email', verification.proposerEmail)}
                {renderField('Annual Income', verification.proposerAnnualIncome)}
                {renderField('Height', verification.proposerHeight)}
                {renderField('Weight', verification.proposerWeight)}
                {renderField('PAN Number', verification.proposerPanNumber)}
                {renderDocumentLink(verification.proposerPanImage, 'PAN Card')}
                <div className="md:col-span-3">
                  {renderField('Address', verification.proposerAddress)}
                </div>
              </div>
            </div>

            {/* Insured Persons */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Insured Persons</h2>
              {verification.insuredPersons && verification.insuredPersons.length > 0 ? (
                verification.insuredPersons.map((person, idx) => (
                  <div key={idx} className="mb-6 p-4 border rounded-lg bg-gray-50">
                    <h3 className="font-semibold text-gray-800 mb-2">Insured Person {idx + 1}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {renderField('Name', person.name)}
                      {renderField('DOB', person.dob, 'date')}
                      {renderField('Gender', person.gender)}
                      {renderField('Relationship', person.relationship)}
                      {renderField('Height', person.height)}
                      {renderField('Weight', person.weight)}
                      {renderField('Aadhar Number', person.aadharNumber)}
                      {renderDocumentLink(person.aadharPhoto, 'Aadhar Photo')}
                      {renderField('Medical History', person.medicalHistory)}
                      {renderField('Pre-existing Disease', person.preExistingDisease)}
                      {renderField('BP/Diabetes', person.bpDiabetes)}
                      {renderField('Current Problems', person.currentProblems)}
                      {renderField('Disclosure Date', person.disclosureDate, 'date')}
                      {renderField('Medicine Name', person.medicineName)}
                      {renderField('Medicine Dose', person.medicineDose)}
                      {renderField('Drinking', person.drinking)}
                      {renderField('Smoking', person.smoking)}
                      {renderField('Chewing', person.chewing)}
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
                ))
              ) : (
                <span className="text-gray-500">No insured persons added.</span>
              )}
            </div>

            {/* Nominee Details */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Nominee Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {renderField('Nominee Name', verification.nomineeName)}
                {renderField('Nominee Relation', verification.nomineeRelation)}
                {renderField('Nominee DOB', verification.nomineeDOB, 'date')}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
} 