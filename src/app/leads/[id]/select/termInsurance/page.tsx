'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { LeadType } from '@/models/Lead';

interface FormData {
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
  
  // Step 1
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

  // Step 4
  panNumber: string;
  panPhoto: File | null;
  aadharNumber: string;
  aadharPhoto: File | null;
  userPhoto: File | null;
  cancelledCheque: File | null;
  bankStatement: File | null;
  otherDocument: File | null;
}

export default function VerificationPage() {
  const { id } = useParams();
  const router = useRouter();
  const [lead, setLead] = useState<LeadType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<FormData>({
    // Initial Selection
    residentialStatus: 'Indian',
    nationality: 'Indian',
    policyFor: 'Self',
    
    // Company Selection
    selectedCompany: '',
    
    // Product Details
    productName: '',
    pt: '',
    ppt: '',
    planVariant: '',
    sumAssured: '',
    isSmoker: 'No',
    modeOfPayment: 'Annual',
    premiumPaymentMethod: 'Regular',
    
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

    // Step 4
    panNumber: '',
    panPhoto: null,
    aadharNumber: '',
    aadharPhoto: null,
    userPhoto: null,
    cancelledCheque: null,
    bankStatement: null,
    otherDocument: null,
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
      
      // Add all form fields that have values
      Object.entries(formData).forEach(([key, value]) => {
        if (value instanceof File) {
          if (value) { // Only append if file exists
            formDataToSend.append(key, value);
          }
        } else if (value !== null && value !== undefined && value !== '') {
          formDataToSend.append(key, value.toString());
        }
      });

      const response = await fetch(`/api/leads/${id}/term-insurance`, {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save form data');
      }

      router.push(`/leads/${id}`);
    } catch (error) {
      console.error('Error saving form:', error);
      setError(error instanceof Error ? error.message : 'Failed to save form data');
    }
  };

  const renderInitialStep = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Residential Status</label>
          <select
            name="residentialStatus"
            value={formData.residentialStatus}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Select Status</option>
            <option value="Indian">Indian</option>
            <option value="NRI">NRI</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Nationality</label>
          <select
            name="nationality"
            value={formData.nationality}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Select Nationality</option>
            <option value="Indian">Indian</option>
            <option value="NRI">NRI</option>
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Policy For</label>
          <select
            name="policyFor"
            value={formData.policyFor}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Select Policy Type</option>
            <option value="Self">Self</option>
            <option value="Dependent">Dependent</option>
            <option value="Business">Business Insurance</option>
          </select>
        </div>
      </div>
    </motion.div>
  );

  const renderProductDetails = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Product Name</label>
          <input
            type="text"
            name="productName"
            value={formData.productName}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        

        <div>
          <label className="block text-sm font-medium text-gray-700">PPT</label>
          <input
            type="number"
            name="ppt"
            value={formData.ppt}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">PT</label>
          <input
            type="number"
            name="pt"
            value={formData.pt}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Plan Variant</label>
          <input
            type="text"
            name="planVariant"
            value={formData.planVariant}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Sum Assured</label>
          <div className="relative">
            <select
              name="sumAssured"
              value={formData.sumAssured}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            >
              <option value="">Select Sum Assured</option>
              <option value="5000000">₹50 Lakhs</option>
              <option value="10000000">₹1 Crore</option>
              <option value="20000000">₹2 Crores</option>
              <option value="30000000">₹3 Crores</option>
              <option value="40000000">₹4 Crores</option>
              <option value="50000000">₹5 Crores</option>
            </select>
          </div>
          <p className="mt-1 text-sm text-gray-500">Select from predefined amounts</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Smoker?</label>
          <select
            name="isSmoker"
            value={formData.isSmoker}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Select</option>
            <option value="No">No</option>
            <option value="Yes">Yes</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Mode of Payment</label>
          <select
            name="modeOfPayment"
            value={formData.modeOfPayment}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Select Mode</option>
            <option value="Annual">Annual</option>
            <option value="Semi Annual">Semi Annual</option>
            <option value="Quarterly">Quarterly</option>
            <option value="Monthly">Monthly</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Premium Payment Method</label>
          <select
            name="premiumPaymentMethod"
            value={formData.premiumPaymentMethod}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Select Method</option>
            <option value="Regular">Regular</option>
            <option value="Single">Single</option>
            <option value="Pay Till 60">Pay Till 60</option>
            <option value="Limited Pay">Limited Pay</option>
          </select>
        </div>
      </div>
    </motion.div>
  );

  const renderStep1 = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Policy Holder Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Mobile Number</label>
          <input
            type="number"
            name="mobileNo"
            value={formData.mobileNo}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Alternate Number</label>
          <input
            type="number"
            name="alternateNo"
            value={formData.alternateNo}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
          <input
            type="date"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Education</label>
          <select
            name="education"
            value={formData.education}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Select Education</option>
            <option value="10th">10th</option>
            <option value="12th">12th</option>
            <option value="Graduate">Graduate</option>
            <option value="Post Graduate">Post Graduate</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Occupation</label>
          <select
            name="occupation"
            value={formData.occupation}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Select Occupation</option>
            <option value="Job">Job</option>
            <option value="Business">Business</option>
            <option value="Self Employed">Self Employed</option>
            <option value="Student">Student</option>
            <option value="Housewife">Housewife</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Organization Name</label>
          <input
            type="text"
            name="organizationName"
            value={formData.organizationName}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Work Belongs To</label>
          <input
            type="text"
            name="workBelongsTo"
            value={formData.workBelongsTo}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Annual Income</label>
          <input
            type="number"
            name="annualIncome"
            value={formData.annualIncome}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Years of Working</label>
          <input
            type="number"
            name="yearsOfWorking"
            value={formData.yearsOfWorking}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Current Address</label>
          <input
            type="text"
            name="currentAddress"
            value={formData.currentAddress}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Permanent Address</label>
          <input
            type="text"
            name="permanentAddress"
            value={formData.permanentAddress}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Marital Status</label>
          <select
            name="maritalStatus"
            value={formData.maritalStatus}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Select Status</option>
            <option value="Single">Single</option>
            <option value="Married">Married</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Place of Birth</label>
          <input
            type="text"
            name="placeOfBirth"
            value={formData.placeOfBirth}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
          <label className="block text-sm font-medium text-gray-700">Father's Full Name</label>
          <input
            type="text"
            name="fatherName"
            value={formData.fatherName}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Father's Age</label>
          <input
            type="number"
            name="fatherAge"
            value={formData.fatherAge}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Father's Status</label>
          <select
            name="fatherStatus"
            value={formData.fatherStatus}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Select Status</option>
            <option value="Alive">Alive</option>
            <option value="Dead">Dead</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Mother's Full Name</label>
          <input
            type="text"
            name="motherName"
            value={formData.motherName}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Mother's Age</label>
          <input
            type="number"
            name="motherAge"
            value={formData.motherAge}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Mother's Status</label>
          <select
            name="motherStatus"
            value={formData.motherStatus}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Select Status</option>
            <option value="Alive">Alive</option>
            <option value="Dead">Dead</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Spouse's Full Name</label>
          <input
            type="text"
            name="spouseName"
            value={formData.spouseName}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Spouse's Age</label>
          <input
            type="number"
            name="spouseAge"
            value={formData.spouseAge}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Nominee Name</label>
          <input
            type="text"
            name="nomineeName"
            value={formData.nomineeName}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Nominee Relation</label>
          <input
            type="text"
            name="nomineeRelation"
            value={formData.nomineeRelation}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Nominee Date of Birth</label>
          <input
            type="date"
            name="nomineeDOB"
            value={formData.nomineeDOB}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
      className="space-y-4"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
       

        <div>
          <label className="block text-sm font-medium text-gray-700">LA Name</label>
          <input
            type="text"
            name="laName"
            value={formData.laName}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">LA Date of Birth</label>
          <input
            type="date"
            name="laDob"
            value={formData.laDob}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Age</label>
          <input
            type="number"
            name="age"
            value={formData.age}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Height (ft)</label>
          <input
            type="number"
            name="heightFt"
            value={formData.heightFt}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Height (inches)</label>
          <input
            type="number"
            name="heightIn"
            value={formData.heightIn}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Weight (kg)</label>
          <input
            type="number"
            name="weight"
            value={formData.weight}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Designation</label>
          <input
            type="text"
            name="designation"
            value={formData.designation}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Existing Policy</label>
          <input
            type="text"
            name="existingPolicy"
            value={formData.existingPolicy}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Premium Amount</label>
          <input
            type="number"
            name="premiumAmount"
            value={formData.premiumAmount}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>
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
          <label className="block text-sm font-medium text-gray-700">PAN Number</label>
          <input
            type="text"
            name="panNumber"
            value={formData.panNumber}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">PAN Card Photo</label>
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => handleFileChange(e, 'panPhoto')}
            className="mt-1 block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Aadhaar Number</label>
          <input
            type="number"
            name="aadharNumber"
            value={formData.aadharNumber}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Aadhaar Card Photo</label>
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => handleFileChange(e, 'aadharPhoto')}
            className="mt-1 block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Photo</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileChange(e, 'userPhoto')}
            className="mt-1 block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Cancelled Cheque</label>
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => handleFileChange(e, 'cancelledCheque')}
            className="mt-1 block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Bank Statement</label>
          <input
            type="file"
            accept=".pdf"
            onChange={(e) => handleFileChange(e, 'bankStatement')}
            className="mt-1 block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Other Document</label>
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => handleFileChange(e, 'otherDocument')}
            className="mt-1 block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-md file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
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
          <h1 className="text-2xl font-bold text-gray-900">Term Insurance Verification Form</h1>
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
            >
              <option value="">Select Company</option>
              <option value="Aditya Birlasun sun life">Aditya Birla sun life</option>
              <option value="Bajaj Allianz life ">Bajaj Allianz life</option>
              <option value="Future Generali India Life Insurance">Future Generali India Life Insurance</option>
              <option value="Digit Insurance">Digit Insurance</option>
              <option value="ICICI Prudential Life Insurance">ICICI Prudential Life Insurance</option>
              <option value="Axis Max Life Insurance">Axis Max Life Insurance</option>
              <option value="PNB Metlife Insurance">PNB Metlife Insurance</option>
              <option value="Tata AIA Life Insurance">Tata AIA Life Insurance</option>
            </select>
          </div>

          <div className="mb-8">
            <div className="flex items-center space-x-4">
              <div className={`h-2 w-2 rounded-full ${currentStep >= 0 ? 'bg-blue-600' : 'bg-gray-300'}`} />
              <div className={`h-2 w-2 rounded-full ${currentStep >= 1 ? 'bg-blue-600' : 'bg-gray-300'}`} />
              <div className={`h-2 w-2 rounded-full ${currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`} />
              <div className={`h-2 w-2 rounded-full ${currentStep >= 3 ? 'bg-blue-600' : 'bg-gray-300'}`} />
              <div className={`h-2 w-2 rounded-full ${currentStep >= 4 ? 'bg-blue-600' : 'bg-gray-300'}`} />
              <div className={`h-2 w-2 rounded-full ${currentStep >= 5 ? 'bg-blue-600' : 'bg-gray-300'}`} />
            </div>
          </div>

          <AnimatePresence mode="wait">
            {currentStep === 0 && renderInitialStep()}
            {currentStep === 1 && renderProductDetails()}
            {currentStep === 2 && renderStep1()}
            {currentStep === 3 && renderStep2()}
            {currentStep === 4 && renderStep3()}
            {currentStep === 5 && renderStep4()}
          </AnimatePresence>

          <div className="mt-8 flex justify-between">
            {currentStep > 0 && (
              <button
                onClick={prevStep}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Previous
              </button>
            )}
            <button
              onClick={currentStep === 5 ? handleSubmit : nextStep}
              className="ml-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {currentStep === 5 ? 'Submit' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 