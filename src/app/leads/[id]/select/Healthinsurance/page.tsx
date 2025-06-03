'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { LeadType } from '@/models/Lead';

interface InsuredPerson {
  name: string;
  dob: string;
  gender: string;
  relationship: string;
  height: string;
  weight: string;
  aadharNumber: string;
  aadharPhoto: string | null;
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

interface FormData {
  // Company Selection
  selectedCompany: string;
  
  // Step 1 - Policy Details
  manufacturerName: string;
  planName: string;
  premium: string;
  ptPpt: string;
  mode: string;
  portFresh: string;
  sumInsured: string;
  sumInsuredType: string;
  rider: string;

  // Step 2 - Proposer Details
  proposerName: string;
  proposerMobile: string;
  proposerEmail: string;
  proposerAddress: string;
  proposerAnnualIncome: string;
  proposerPanNumber: string;
  proposerPanImage: File | null;
  proposerHeight: string;
  proposerWeight: string;
  
  // Step 1
  name: string;
  mobileNo: string;
  alternateNo: string;
  email: string;
  dateOfBirth: string;
  education: string;
  occupation: 'Job' | 'Business' | 'Self Employed' | 'Student' | 'Housewife';
  organizationName: string;
  workBelongsTo: string;
  annualIncome: string;
  yearsOfWorking: string;
  currentAddress: string;
  permanentAddress: string;
  maritalStatus: 'Single' | 'Married';
  placeOfBirth: string;

  // Step 2
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

  // Step 3
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
  remarks: string;

  // Step 4
  panNumber: string;
  panPhoto: File | null;
  aadharNumber: string;
  aadharPhoto: string | null;
  userPhoto: File | null;
  cancelledCheque: File | null;
  bankStatement: File | null;

  // Step 3 - Insured Persons
  insuredPersons: InsuredPerson[];
}

// Helper function to upload a file and return the path
async function uploadHealthFile(file: File, leadId: string) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`/api/leads/${leadId}/health-insurance/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) throw new Error('Failed to upload file');
  const data = await res.json();
  return data.fileUrl;
}

export default function VerificationPage() {
  const { id } = useParams();
  const router = useRouter();
  const [lead, setLead] = useState<LeadType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    // Company Selection
    selectedCompany: '',
    
    // Step 1 - Policy Details
    manufacturerName: '',
    planName: '',
    premium: '',
    ptPpt: '',
    mode: '',
    portFresh: '',
    sumInsured: '',
    sumInsuredType: '',
    rider: '',

    // Step 2 - Proposer Details
    proposerName: '',
    proposerMobile: '',
    proposerEmail: '',
    proposerAddress: '',
    proposerAnnualIncome: '',
    proposerPanNumber: '',
    proposerPanImage: null,
    proposerHeight: '',
    proposerWeight: '',
    
    // Step 1
    name: '',
    mobileNo: '',
    alternateNo: '',
    email: '',
    dateOfBirth: '',
    education: '',
    occupation: 'Job',
    organizationName: '',
    workBelongsTo: '',
    annualIncome: '',
    yearsOfWorking: '',
    currentAddress: '',
    permanentAddress: '',
    maritalStatus: 'Single',
    placeOfBirth: '',

    // Step 2
    fatherName: '',
    fatherAge: '',
    fatherStatus: 'Alive',
    motherName: '',
    motherAge: '',
    motherStatus: 'Alive',
    spouseName: '',
    spouseAge: '',
    nomineeName: '',
    nomineeRelation: '',
    nomineeDOB: '',

    // Step 3
    laProposal: '',
    laName: '',
    laDob: '',
    age: '',
    heightFt: '',
    heightIn: '',
    weight: '',
    designation: '',
    existingPolicy: '',
    premiumAmount: '',
    remarks: '',

    // Step 4
    panNumber: '',
    panPhoto: null,
    aadharNumber: '',
    aadharPhoto: null,
    userPhoto: null,
    cancelledCheque: null,
    bankStatement: null,

    // Step 3 - Insured Persons
    insuredPersons: [{
      name: '',
      dob: '',
      gender: '',
      relationship: '',
      height: '',
      weight: '',
      aadharNumber: '',
      aadharPhoto: null,
      medicalHistory: '',
      preExistingDisease: '',
      bpDiabetes: '',
      currentProblems: '',
      disclosureDate: '',
      medicineName: '',
      medicineDose: '',
      drinking: 'No',
      smoking: 'No',
      chewing: 'No',
      medicalDocuments: [],
    }],
  });

  const fetchData = useCallback(async () => {
    try {
      // Fetch lead data
      const leadRes = await fetch(`/api/leads/${id}`);
      if (!leadRes.ok) {
        throw new Error('Lead not found');
      }
      const leadData = await leadRes.json();
      setLead(leadData);

      // Only proceed if lead status is 'Won'
      if (leadData.status !== 'Won') {
        router.push(`/leads/${id}`);
        return;
      }

      // Pre-fill form data if available
      if (leadData.verificationData) {
        setFormData(leadData.verificationData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof FormData) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({
      ...prev,
      [field]: file
    }));
  };

  const nextStep = () => {
    setCurrentStep(prev => prev + 1);
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    try {
      setError('');
      
      // Create FormData object
      const formDataToSend = new FormData();
      
      // Add all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value instanceof File) {
          formDataToSend.append(key, value);
        } else if (Array.isArray(value)) {
          formDataToSend.append(key, JSON.stringify(value));
        } else if (value !== null && value !== undefined) {
          formDataToSend.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/leads/${id}/health-insurance`, {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save form data');
      }

      // Show success message and redirect
      alert('Health insurance data saved successfully!');
      router.push(`/leads/${id}`);
    } catch (error) {
      console.error('Error saving form:', error);
      setError(error instanceof Error ? error.message : 'Failed to save form data');
    }
  };

  const addInsuredPerson = () => {
    if (formData.insuredPersons.length < 4) {
      setFormData(prev => ({
        ...prev,
        insuredPersons: [...prev.insuredPersons, {
          name: '',
          dob: '',
          gender: '',
          relationship: '',
          height: '',
          weight: '',
          aadharNumber: '',
          aadharPhoto: null,
          medicalHistory: '',
          preExistingDisease: '',
          bpDiabetes: '',
          currentProblems: '',
          disclosureDate: '',
          medicineName: '',
          medicineDose: '',
          drinking: 'No',
          smoking: 'No',
          chewing: 'No',
          medicalDocuments: [],
        }]
      }));
    }
  };

  const removeInsuredPerson = (index: number) => {
    setFormData(prev => ({
      ...prev,
      insuredPersons: prev.insuredPersons.filter((_, i) => i !== index)
    }));
  };

  const handleInsuredPersonChange = (index: number, field: keyof InsuredPerson, value: string | File | null) => {
    setFormData(prev => ({
      ...prev,
      insuredPersons: prev.insuredPersons.map((person, i) => 
        i === index ? { ...person, [field]: value } : person
      )
    }));
  };

  const handleInsuredPersonAadharPhotoChange = async (index: number, file: File | null) => {
    if (!file) return;
    try {
      const fileUrl = await uploadHealthFile(file, id as string);
      setFormData(prev => ({
        ...prev,
        insuredPersons: prev.insuredPersons.map((person, i) =>
          i === index ? { ...person, aadharPhoto: fileUrl } : person
        )
      }));
    } catch (err) {
      alert('Failed to upload Aadhar photo');
    }
  };

  const handleMedicalDocumentUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    try {
      const uploadedUrls = await Promise.all(
        files.map(file => uploadHealthFile(file, id as string))
      );
      setFormData(prev => ({
        ...prev,
        insuredPersons: prev.insuredPersons.map((person, i) =>
          i === index ? { ...person, medicalDocuments: [...person.medicalDocuments, ...uploadedUrls] } : person
        )
      }));
    } catch (err) {
      alert('Failed to upload medical document(s)');
    }
  };

  const removeMedicalDocument = (personIndex: number, docIndex: number) => {
    setFormData(prev => ({
      ...prev,
      insuredPersons: prev.insuredPersons.map((person, i) => 
        i === personIndex ? {
          ...person,
          medicalDocuments: person.medicalDocuments.filter((_, j) => j !== docIndex)
        } : person
      )
    }));
  };

  const renderStep1 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
       

        <div>
          <label className="block text-sm font-medium text-gray-700">Plan Name</label>
          <input
            type="text"
            name="planName"
            value={formData.planName}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Premium</label>
          <input
            type="number"
            name="premium"
            value={formData.premium}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">PT/PPT</label>
          <input
            type="text"
            name="ptPpt"
            value={formData.ptPpt}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Mode</label>
          <select
            name="mode"
            value={formData.mode}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          >
            <option value="">Select Mode</option>
            <option value="Monthly">Monthly</option>
            <option value="Quarterly">Quarterly</option>
            <option value="Half Yearly">Half Yearly</option>
            <option value="Yearly">Yearly</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Port/Fresh</label>
          <select
            name="portFresh"
            value={formData.portFresh}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          >
            <option value="">Select Option</option>
            <option value="Port">Port</option>
            <option value="Fresh">Fresh</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Sum Insured</label>
          <input
            type="number"
            name="sumInsured"
            value={formData.sumInsured}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Sum Insured Type</label>
          <select
            name="sumInsuredType"
            value={formData.sumInsuredType}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          >
            <option value="">Select Type</option>
            <option value="Individual">Individual</option>
            <option value="Family Floater">Family Floater</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Rider (if any)</label>
          <input
            type="text"
            name="rider"
            value={formData.rider}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Enter rider details if applicable"
          />
        </div>
      </div>
    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Proposer Name</label>
          <input
            type="text"
            name="proposerName"
            value={formData.proposerName}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Mobile Number</label>
          <input
            type="number"
            name="proposerMobile"
            value={formData.proposerMobile}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Email ID</label>
          <input
            type="email"
            name="proposerEmail"
            value={formData.proposerEmail}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Annual Income</label>
          <input
            type="number"
            name="proposerAnnualIncome"
            value={formData.proposerAnnualIncome}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Height (cm)</label>
          <input
            type="number"
            name="proposerHeight"
            value={formData.proposerHeight}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Weight (kg)</label>
          <input
            type="number"
            name="proposerWeight"
            value={formData.proposerWeight}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">PAN Card Number</label>
          <input
            type="text"
            name="proposerPanNumber"
            value={formData.proposerPanNumber}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">PAN Card Image</label>
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => handleFileChange(e, 'proposerPanImage')}
            className="mt-1 block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
            required
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Address</label>
          <textarea
            name="proposerAddress"
            value={formData.proposerAddress}
            onChange={(e) => handleInputChange(e as any)}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>
      </div>
    </motion.div>
  );

  const renderStep3 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {formData.insuredPersons.map((person, index) => (
        <div key={index} className="bg-gray-50 p-6 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Insured Person {index + 1}</h3>
            {index > 0 && (
              <button
                type="button"
                onClick={() => removeInsuredPerson(index)}
                className="text-red-600 hover:text-red-800"
              >
                Remove
              </button>
            )}
          </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <h4 className="text-md font-medium text-gray-700 mb-3">Basic Details</h4>
        </div>

        <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
                value={person.name}
                onChange={(e) => handleInsuredPersonChange(index, 'name', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
          />
        </div>

        <div>
              <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
          <input
            type="date"
                value={person.dob}
                onChange={(e) => handleInsuredPersonChange(index, 'dob', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
          />
        </div>

        <div>
              <label className="block text-sm font-medium text-gray-700">Gender</label>
              <select
                value={person.gender}
                onChange={(e) => handleInsuredPersonChange(index, 'gender', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
        </div>

        <div>
              <label className="block text-sm font-medium text-gray-700">Relationship with Proposer</label>
              <select
                value={person.relationship}
                onChange={(e) => handleInsuredPersonChange(index, 'relationship', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              >
                <option value="">Select Relationship</option>
                <option value="Self">Self</option>
                <option value="Spouse">Spouse</option>
                <option value="Child">Child</option>
                <option value="Parent">Parent</option>
                <option value="Sibling">Sibling</option>
              </select>
        </div>

        <div>
              <label className="block text-sm font-medium text-gray-700">Height (cm)</label>
          <input
            type="number"
                value={person.height}
                onChange={(e) => handleInsuredPersonChange(index, 'height', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Weight (kg)</label>
          <input
            type="number"
                value={person.weight}
                onChange={(e) => handleInsuredPersonChange(index, 'weight', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
          />
        </div>

        <div>
              <label className="block text-sm font-medium text-gray-700">Aadhar Number</label>
          <input
            type="number"
                value={person.aadharNumber}
                onChange={(e) => handleInsuredPersonChange(index, 'aadharNumber', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
          />
        </div>

        <div>
              <label className="block text-sm font-medium text-gray-700">Aadhar Photo</label>
          <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => handleInsuredPersonAadharPhotoChange(index, e.target.files?.[0] || null)}
                className="mt-1 block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100"
                required
          />
        </div>

            <div className="md:col-span-2 mt-4">
              <h4 className="text-md font-medium text-gray-700 mb-3">Medical Details</h4>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Medical History</label>
              <textarea
                value={person.medicalHistory}
                onChange={(e) => handleInsuredPersonChange(index, 'medicalHistory', e.target.value)}
                rows={2}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter any past medical conditions or surgeries"
          />
        </div>

        <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Pre-existing Diseases</label>
          <textarea
                value={person.preExistingDisease}
                onChange={(e) => handleInsuredPersonChange(index, 'preExistingDisease', e.target.value)}
                rows={2}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter any pre-existing diseases"
          />
        </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">BP/Diabetes Status</label>
              <select
                value={person.bpDiabetes}
                onChange={(e) => handleInsuredPersonChange(index, 'bpDiabetes', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Select Status</option>
                <option value="None">None</option>
                <option value="BP">BP</option>
                <option value="Diabetes">Diabetes</option>
                <option value="Both">Both</option>
              </select>
            </div>

        <div>
              <label className="block text-sm font-medium text-gray-700">Disclosure Date</label>
          <input
                type="date"
                value={person.disclosureDate}
                onChange={(e) => handleInsuredPersonChange(index, 'disclosureDate', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Current Problems</label>
              <textarea
                value={person.currentProblems}
                onChange={(e) => handleInsuredPersonChange(index, 'currentProblems', e.target.value)}
                rows={2}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter any current health problems"
          />
        </div>

        <div>
              <label className="block text-sm font-medium text-gray-700">Medicine Name</label>
          <input
            type="text"
                value={person.medicineName}
                onChange={(e) => handleInsuredPersonChange(index, 'medicineName', e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter medicine names if any"
          />
        </div>

        <div>
              <label className="block text-sm font-medium text-gray-700">Medicine Dose</label>
          <input
                type="text"
                value={person.medicineDose}
                onChange={(e) => handleInsuredPersonChange(index, 'medicineDose', e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter medicine doses"
          />
        </div>

            <div className="md:col-span-2 mt-4">
              <h4 className="text-md font-medium text-gray-700 mb-3">Lifestyle</h4>
            </div>

        <div>
              <label className="block text-sm font-medium text-gray-700">Drinking</label>
              <select
                value={person.drinking}
                onChange={(e) => handleInsuredPersonChange(index, 'drinking', e.target.value as 'Yes' | 'No')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Smoking</label>
              <select
                value={person.smoking}
                onChange={(e) => handleInsuredPersonChange(index, 'smoking', e.target.value as 'Yes' | 'No')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Chewing</label>
              <select
                value={person.chewing}
                onChange={(e) => handleInsuredPersonChange(index, 'chewing', e.target.value as 'Yes' | 'No')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>

            {/* Medical Documents Section */}
            <div className="md:col-span-2 mt-6">
              <h4 className="text-md font-medium text-gray-700 mb-3">Medical Documents</h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Upload Medical Reports/Records
                  </label>
          <input
            type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleMedicalDocumentUpload(index, e)}
            className="mt-1 block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
                  <p className="mt-1 text-sm text-gray-500">
                    Upload any medical reports, prescriptions, or relevant documents (PDF, JPG, PNG)
                  </p>
        </div>

                {person.medicalDocuments.length > 0 && (
                  <div className="mt-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Uploaded Documents:</h5>
                    <ul className="space-y-2">
                      {person.medicalDocuments.map((doc, docIndex) => (
                        <li key={docIndex} className="flex items-center justify-between bg-white p-2 rounded-md">
                          <a href={doc} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline truncate max-w-xs">{doc.split('/').pop()}</a>
                          <button
                            type="button"
                            onClick={() => removeMedicalDocument(index, docIndex)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      {formData.insuredPersons.length < 4 && (
        <button
          type="button"
          onClick={addInsuredPerson}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Add Another Insured Person
        </button>
      )}
    </motion.div>
  );

  const renderStep4 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Nominee Name</label>
          <input
            type="text"
            name="nomineeName"
            value={formData.nomineeName}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Relation with Proposer</label>
          <select
            name="nomineeRelation"
            value={formData.nomineeRelation}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          >
            <option value="">Select Relation</option>
            <option value="Spouse">Spouse</option>
            <option value="Child">Child</option>
            <option value="Parent">Parent</option>
            <option value="Sibling">Sibling</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Nominee Date of Birth</label>
          <input
            type="date"
            name="nomineeDOB"
            value={formData.nomineeDOB}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>
      </div>
    </motion.div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
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

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Health Insurance Verification Form</h1>
          <Link
            href={`/leads/${id}/select`}
            className="text-blue-600 hover:text-blue-800"
          >
            Back to Selection
          </Link>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Company Selection */}
          <div className="mb-8">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Insurance Company</label>
            <select
              name="selectedCompany"
              value={formData.selectedCompany}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            >
              <option value="">Select Company</option>
              <option value="Star Health Insurance">Star Health Insurance</option>
              <option value="Zuno General Insurance ">Zuno General Insurance</option>
              <option value="Tata AIG Insurance">Tata AIG Insurance</option>
              <option value="DigitPlus Insurance">DigitPlus Insurance</option>
              <option value="Niva Bupa Health Insurance">Niva Bupa Health Insurance</option>
              <option value="ICICI Lombard">ICICI Lombard</option>
              <option value="HDFC ERGO">HDFC ERGO</option>
              <option value="Care Plus Health Insurance">Care Plus Health Insurance</option>
            </select>
          </div>

          <div className="mb-8">
            <div className="flex items-center space-x-4">
              <div className={`h-2 w-2 rounded-full ${currentStep >= 1 ? 'bg-blue-600' : 'bg-gray-300'}`} />
              <div className={`h-2 w-2 rounded-full ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`} />
              <div className={`h-2 w-2 rounded-full ${currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-300'}`} />
              <div className={`h-2 w-2 rounded-full ${currentStep >= 4 ? 'bg-blue-600' : 'bg-gray-300'}`} />
            </div>
          </div>

          <AnimatePresence mode="wait">
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
          </AnimatePresence>

          <div className="mt-8 flex justify-between">
            {currentStep > 1 && (
              <button
                onClick={prevStep}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Previous
              </button>
            )}
            <button
              onClick={currentStep === 4 ? handleSubmit : nextStep}
              className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {currentStep === 4 ? 'Submit' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}  