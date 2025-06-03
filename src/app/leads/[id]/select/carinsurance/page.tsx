'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { LeadType } from '@/models/Lead';

interface FormData {
  selectedCompany: string;
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
  panCard: File | null;
  aadharCard: File | null;
  rcCopy: File | null;
  policyCopy: File | null;
}

export default function CarInsurancePage() {
  const { id } = useParams();
  const router = useRouter();
  const [lead, setLead] = useState<LeadType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<FormData>({
    selectedCompany: '',
    vehicleType: '',
    policyCover: '',
    registrationNumber: '',
    registrationMonth: '',
    registrationYear: '',
    vehicleBrand: '',
    fuelType: '',
    vehicleVariant: '',
    city: '',
    pincode: '',
    isBharatSeries: false,
    hasPreviousClaim: '',
    
    // Previous Policy Details
    previousPolicyType: 'none',
    previousPolicyExpiryDate: '',
    existingPolicyNCB: '',
    previousInsurerName: '',
    
    // Documents
    panCard: null,
    aadharCard: null,
    rcCopy: null,
    policyCopy: null,
  });

  const fetchData = async () => {
    try {
      const leadRes = await fetch(`/api/leads/${id}`);
      if (!leadRes.ok) {
        throw new Error('Lead not found');
      }
      const leadData = await leadRes.json();
      setLead(leadData);

      if (leadData.status !== 'Won') {
        router.push(`/leads/${id}`);
        return;
      }

      if (leadData.verificationData) {
        setFormData(leadData.verificationData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof FormData) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({
        ...prev,
        [field]: e.target.files![0]
      }));
    }
  };

  const handleSubmit = async () => {
    try {
      setError('');
      
      const formDataToSend = new FormData();
      formDataToSend.append('selectedCompany', formData.selectedCompany);
      formDataToSend.append('vehicleType', formData.vehicleType);
      formDataToSend.append('policyCover', formData.policyCover);
      formDataToSend.append('registrationNumber', formData.registrationNumber);
      formDataToSend.append('registrationMonth', formData.registrationMonth);
      formDataToSend.append('registrationYear', formData.registrationYear);
      formDataToSend.append('vehicleBrand', formData.vehicleBrand);
      formDataToSend.append('fuelType', formData.fuelType);
      formDataToSend.append('vehicleVariant', formData.vehicleVariant);
      formDataToSend.append('city', formData.city);
      formDataToSend.append('pincode', formData.pincode);
      formDataToSend.append('isBharatSeries', formData.isBharatSeries.toString());
      formDataToSend.append('hasPreviousClaim', formData.hasPreviousClaim);
      formDataToSend.append('previousPolicyType', formData.previousPolicyType);
      formDataToSend.append('previousPolicyExpiryDate', formData.previousPolicyExpiryDate);
      formDataToSend.append('existingPolicyNCB', formData.existingPolicyNCB);
      formDataToSend.append('previousInsurerName', formData.previousInsurerName);

      // Append documents
      if (formData.panCard) formDataToSend.append('panCard', formData.panCard);
      if (formData.aadharCard) formDataToSend.append('aadharCard', formData.aadharCard);
      if (formData.rcCopy) formDataToSend.append('rcCopy', formData.rcCopy);
      if (formData.policyCopy) formDataToSend.append('policyCopy', formData.policyCopy);

      const response = await fetch(`/api/leads/${id}/car-insurance`, {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Car Insurance Form</h1>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Insurance Company</label>
            <select
              name="selectedCompany"
              value={formData.selectedCompany}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            >
              <option value="">Select Company</option>
                <option value="TATA AIG">TATA AIG</option>
              <option value="Go Digit">Go Digit</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Type</label>
              <select
                name="vehicleType"
                value={formData.vehicleType}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              >
                <option value="">Select Vehicle Type</option>
                <option value="Two Wheeler Comprehensive">Two Wheeler Comprehensive</option>
                <option value="Two Wheeler SAOD">Two Wheeler SAOD</option>
                <option value="Two Wheeler Third Party">Two Wheeler Third Party</option>
                <option value="Four Wheeler Comprehensive">Four Wheeler Comprehensive</option>
                <option value="Four Wheeler Third Party">Four Wheeler Third Party</option>
                <option value="Four Wheeler SAOD">Four Wheeler SAOD</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Policy Cover</label>
              <select
                name="policyCover"
                value={formData.policyCover}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              >
                <option value="">Select Policy Cover</option>
                <option value="Comprehensive">Comprehensive</option>
                <option value="Third Party">Third Party</option>
                <option value="Zero Depreciation">Zero Depreciation</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Registration Number</label>
              <input
                type="text"
                name="registrationNumber"
                value={formData.registrationNumber}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Registration Month</label>
              <select
                name="registrationMonth"
                value={formData.registrationMonth}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              >
                <option value="">Select Month</option>
                <option value="01">January</option>
                <option value="02">February</option>
                <option value="03">March</option>
                <option value="04">April</option>
                <option value="05">May</option>
                <option value="06">June</option>
                <option value="07">July</option>
                <option value="08">August</option>
                <option value="09">September</option>
                <option value="10">October</option>
                <option value="11">November</option>
                <option value="12">December</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Registration Year</label>
              <select
                name="registrationYear"
                value={formData.registrationYear}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              >
                <option value="">Select Year</option>
                {Array.from({ length: 30 }, (_, i) => {
                  const year = new Date().getFullYear() - i;
                  return (
                    <option key={year} value={year.toString()}>
                      {year}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Brand</label>
              <input
                type="text"
                name="vehicleBrand"
                value={formData.vehicleBrand}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Fuel Type</label>
              <select
                name="fuelType"
                value={formData.fuelType}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              >
                <option value="">Select Fuel Type</option>
                <option value="Petrol">Petrol</option>
                <option value="Diesel">Diesel</option>
                <option value="CNG">CNG</option>
                <option value="Electric">Electric</option>
                <option value="Hybrid">Hybrid</option>
            </select>
          </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Variant</label>
              <input
                type="text"
                name="vehicleVariant"
                value={formData.vehicleVariant}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pincode</label>
              <input
                type="number"
                name="pincode"
                value={formData.pincode}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isBharatSeries"
                  checked={formData.isBharatSeries}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700">
                  Is Bharat Series Registered Vehicle
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Previous Claim</label>
              <select
                name="hasPreviousClaim"
                value={formData.hasPreviousClaim}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              >
                <option value="">Select Option</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            <div className="md:col-span-2 mt-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Previous Policy Details</h3>
              
              <div className="space-y-4">
                <div className="flex flex-col space-y-2">
                  <label className="text-sm font-medium text-gray-700">Select Previous Policy Type:</label>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="previousPolicyType"
                        value="none"
                        checked={formData.previousPolicyType === 'none'}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <label className="ml-2 block text-sm text-gray-700">
                        None
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="previousPolicyType"
                        value="used_vehicle"
                        checked={formData.previousPolicyType === 'used_vehicle'}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <label className="ml-2 block text-sm text-gray-700">
                        Click here if customer bought a used vehicle and looking for fresh policy
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="previousPolicyType"
                        value="name_transfer"
                        checked={formData.previousPolicyType === 'name_transfer'}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <label className="ml-2 block text-sm text-gray-700">
                        Click here if name transfer on previous policy
                      </label>
                    </div>
                    
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="previousPolicyType"
                        value="unknown"
                        checked={formData.previousPolicyType === 'unknown'}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <label className="ml-2 block text-sm text-gray-700">
                        Click here if previous policy details are not known
                      </label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Previous Policy Expiry Date</label>
                    <input
                      type="date"
                      name="previousPolicyExpiryDate"
                      value={formData.previousPolicyExpiryDate}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Existing Policy NCB (%)</label>
                    <input
                      type="number"
                      name="existingPolicyNCB"
                      value={formData.existingPolicyNCB}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Enter NCB percentage"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Previous Insurer Name</label>
                    <input
                      type="text"
                      name="previousInsurerName"
                      value={formData.previousInsurerName}
                      onChange={handleInputChange}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Enter previous insurer name"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 mt-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Required Documents</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">PAN Card</label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileChange(e, 'panCard')}
                    className="mt-1 block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Aadhar Card</label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileChange(e, 'aadharCard')}
                    className="mt-1 block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">RC Copy</label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileChange(e, 'rcCopy')}
                    className="mt-1 block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Previous Policy Copy</label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => handleFileChange(e, 'policyCopy')}
                    className="mt-1 block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 