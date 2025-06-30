import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import TermInsuranceVerification from '@/models/TermInsuranceVerification';
import HealthInsuranceVerification from '@/models/HealthInsuranceVerification';
import LifeInsuranceVerification from '@/models/LifeInsuranceVerification';
import CarInsuranceVerification from '@/models/CarInsuranceVerification';
import { Lead } from '@/models/Lead';
import { User } from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { leadIds } = await request.json();

    if (!leadIds || !Array.isArray(leadIds)) {
      return NextResponse.json(
        { error: 'Lead IDs array is required' },
        { status: 400 }
      );
    }

    // Fetch leads and users for reference
    const [leads, users] = await Promise.all([
      Lead.find({ _id: { $in: leadIds } }).lean(),
      User.find({}).lean()
    ]);

    // Create a map for quick user lookup
    const userMap = new Map(users.map((user: any) => [user._id.toString(), user.name]));

    // Fetch verification details for all insurance types
    const [termVerifications, healthVerifications, lifeVerifications, carVerifications] = await Promise.all([
      TermInsuranceVerification.find({ leadId: { $in: leadIds } }).lean(),
      HealthInsuranceVerification.find({ leadId: { $in: leadIds } }).lean(),
      LifeInsuranceVerification.find({ leadId: { $in: leadIds } }).lean(),
      CarInsuranceVerification.find({ leadId: { $in: leadIds } }).lean()
    ]);

    // Create a map of verification data by leadId
    const verificationMap = new Map();

    // Process term insurance verifications
    termVerifications.forEach(verification => {
      verificationMap.set(verification.leadId.toString(), {
        ...verification,
        insuranceType: 'term_insurance'
      });
    });

    // Process health insurance verifications
    healthVerifications.forEach(verification => {
      verificationMap.set(verification.leadId.toString(), {
        ...verification,
        insuranceType: 'health_insurance'
      });
    });

    // Process life insurance verifications
    lifeVerifications.forEach(verification => {
      verificationMap.set(verification.leadId.toString(), {
        ...verification,
        insuranceType: 'life_insurance'
      });
    });

    // Process car insurance verifications
    carVerifications.forEach(verification => {
      verificationMap.set(verification.leadId.toString(), {
        ...verification,
        insuranceType: 'car_insurance'
      });
    });

    // Prepare export data
    const exportData = leads.map((lead: any) => {
      const verification = verificationMap.get(lead._id.toString());
      const assignedUserName = userMap.get(lead.assignedTo?.toString()) || 'Unassigned';

      if (!verification) {
        return {
          'Lead ID': lead._id,
          'Lead Name': lead.name,
          'Lead Phone': lead.phoneNumber,
          'Lead Email': lead.email || '-',
          'Lead Status': lead.status,
          'Assigned To': assignedUserName,
          'Lead Created At': new Date(lead.createdAt).toLocaleDateString(),
          'Insurance Type': 'No verification data',
          'Verification Status': 'No verification data',
          'Verification Created At': '-',
          'Verification Updated At': '-'
        };
      }

      // Base verification data
      const baseData = {
        'Lead ID': lead._id,
        'Lead Name': lead.name,
        'Lead Phone': lead.phoneNumber,
        'Lead Email': lead.email || '-',
        'Lead Status': lead.status,
        'Assigned To': assignedUserName,
        'Lead Created At': new Date(lead.createdAt).toLocaleDateString(),
        'Insurance Type': verification.insuranceType.replace('_', ' ').toUpperCase(),
        'Verification Status': verification.status.toUpperCase(),
        'Verification Created At': new Date(verification.createdAt).toLocaleDateString(),
        'Verification Updated At': new Date(verification.updatedAt).toLocaleDateString(),
        'Selected Company': verification.selectedCompany || '-',
      };

      // Add insurance type specific data
      let insuranceSpecificData: any = {};

      if (verification.insuranceType === 'term_insurance') {
        insuranceSpecificData = {
          'Residential Status': verification.residentialStatus || '-',
          'Nationality': verification.nationality || '-',
          'Policy For': verification.policyFor || '-',
          'Product Name': verification.productName || '-',
          'PT': verification.pt || '-',
          'PPT': verification.ppt || '-',
          'Plan Variant': verification.planVariant || '-',
          'Sum Assured': verification.sumAssured || '-',
          'Is Smoker': verification.isSmoker || '-',
          'Mode of Payment': verification.modeOfPayment || '-',
          'Premium Payment Method': verification.premiumPaymentMethod || '-',
          'Name': verification.name || '-',
          'Mobile No': verification.mobileNo || '-',
          'Alternate No': verification.alternateNo || '-',
          'Email': verification.email || '-',
          'Date of Birth': verification.dateOfBirth || '-',
          'Education': verification.education || '-',
          'Occupation': verification.occupation || '-',
          'Organization Name': verification.organizationName || '-',
          'Work Belongs To': verification.workBelongsTo || '-',
          'Annual Income': verification.annualIncome || '-',
          'Years of Working': verification.yearsOfWorking || '-',
          'Current Address': verification.currentAddress || '-',
          'Permanent Address': verification.permanentAddress || '-',
          'Marital Status': verification.maritalStatus || '-',
          'Place of Birth': verification.placeOfBirth || '-',
          'Father Name': verification.fatherName || '-',
          'Father Age': verification.fatherAge || '-',
          'Father Status': verification.fatherStatus || '-',
          'Mother Name': verification.motherName || '-',
          'Mother Age': verification.motherAge || '-',
          'Mother Status': verification.motherStatus || '-',
          'Spouse Name': verification.spouseName || '-',
          'Spouse Age': verification.spouseAge || '-',
          'Nominee Name': verification.nomineeName || '-',
          'Nominee Relation': verification.nomineeRelation || '-',
          'Nominee DOB': verification.nomineeDOB || '-',
          'LA Proposal': verification.laProposal || '-',
          'LA Name': verification.laName || '-',
          'LA DOB': verification.laDob || '-',
          'Age': verification.age || '-',
          'Height (Ft)': verification.heightFt || '-',
          'Height (In)': verification.heightIn || '-',
          'Weight': verification.weight || '-',
          'Designation': verification.designation || '-',
          'Existing Policy': verification.existingPolicy || '-',
          'Premium Amount': verification.premiumAmount || '-',
          'PAN Number': verification.panNumber || '-',
          'Aadhar Number': verification.aadharNumber || '-',
        };
      } else if (verification.insuranceType === 'health_insurance') {
        insuranceSpecificData = {
          'Manufacturer Name': verification.manufacturerName || '-',
          'Plan Name': verification.planName || '-',
          'Premium': verification.premium || '-',
          'PT/PPT': verification.ptPpt || '-',
          'Mode': verification.mode || '-',
          'Port/Fresh': verification.portFresh || '-',
          'Sum Insured': verification.sumInsured || '-',
          'Sum Insured Type': verification.sumInsuredType || '-',
          'Rider': verification.rider || '-',
          'Proposer Name': verification.proposerName || '-',
          'Proposer Mobile': verification.proposerMobile || '-',
          'Proposer Email': verification.proposerEmail || '-',
          'Proposer Address': verification.proposerAddress || '-',
          'Proposer Annual Income': verification.proposerAnnualIncome || '-',
          'Proposer PAN Number': verification.proposerPanNumber || '-',
          'Proposer Height': verification.proposerHeight || '-',
          'Proposer Weight': verification.proposerWeight || '-',
          'Nominee Name': verification.nomineeName || '-',
          'Nominee Relation': verification.nomineeRelation || '-',
          'Nominee DOB': verification.nomineeDOB || '-',
          'PAN Number': verification.panNumber || '-',
          'Aadhar Number': verification.aadharNumber || '-',
        };

        // Add insured persons data
        if (verification.insuredPersons && verification.insuredPersons.length > 0) {
          verification.insuredPersons.forEach((person: any, index: number) => {
            insuranceSpecificData[`Insured Person ${index + 1} - Name`] = person.name || '-';
            insuranceSpecificData[`Insured Person ${index + 1} - DOB`] = person.dob || '-';
            insuranceSpecificData[`Insured Person ${index + 1} - Gender`] = person.gender || '-';
            insuranceSpecificData[`Insured Person ${index + 1} - Relationship`] = person.relationship || '-';
            insuranceSpecificData[`Insured Person ${index + 1} - Height`] = person.height || '-';
            insuranceSpecificData[`Insured Person ${index + 1} - Weight`] = person.weight || '-';
            insuranceSpecificData[`Insured Person ${index + 1} - Aadhar Number`] = person.aadharNumber || '-';
            insuranceSpecificData[`Insured Person ${index + 1} - Medical History`] = person.medicalHistory || '-';
            insuranceSpecificData[`Insured Person ${index + 1} - Pre-existing Disease`] = person.preExistingDisease || '-';
            insuranceSpecificData[`Insured Person ${index + 1} - BP/Diabetes`] = person.bpDiabetes || '-';
            insuranceSpecificData[`Insured Person ${index + 1} - Current Problems`] = person.currentProblems || '-';
            insuranceSpecificData[`Insured Person ${index + 1} - Disclosure Date`] = person.disclosureDate || '-';
            insuranceSpecificData[`Insured Person ${index + 1} - Medicine Name`] = person.medicineName || '-';
            insuranceSpecificData[`Insured Person ${index + 1} - Medicine Dose`] = person.medicineDose || '-';
            insuranceSpecificData[`Insured Person ${index + 1} - Drinking`] = person.drinking || '-';
            insuranceSpecificData[`Insured Person ${index + 1} - Smoking`] = person.smoking || '-';
            insuranceSpecificData[`Insured Person ${index + 1} - Chewing`] = person.chewing || '-';
          });
        }
      } else if (verification.insuranceType === 'life_insurance') {
        insuranceSpecificData = {
          'Residential Status': verification.residentialStatus || '-',
          'Nationality': verification.nationality || '-',
          'Policy For': verification.policyFor || '-',
          'Product Name': verification.productName || '-',
          'PT': verification.pt || '-',
          'PPT': verification.ppt || '-',
          'Plan Variant': verification.planVariant || '-',
          'Premium': verification.premium || '-',
          'Is Smoker': verification.isSmoker || '-',
          'Mode of Payment': verification.modeOfPayment || '-',
          'Premium Payment Method': verification.premiumPaymentMethod || '-',
          'Income Payout Option': verification.incomePayoutOption || '-',
          'Income Payout Mode': verification.incomePayoutMode || '-',
          'Rider': verification.rider || '-',
          'Name': verification.name || '-',
          'Mobile No': verification.mobileNo || '-',
          'Alternate No': verification.alternateNo || '-',
          'Email': verification.email || '-',
          'Date of Birth': verification.dateOfBirth || '-',
          'Education': verification.education || '-',
          'Occupation': verification.occupation || '-',
          'Organization Name': verification.organizationName || '-',
          'Work Belongs To': verification.workBelongsTo || '-',
          'Annual Income': verification.annualIncome || '-',
          'Years of Working': verification.yearsOfWorking || '-',
          'Current Address': verification.currentAddress || '-',
          'Permanent Address': verification.permanentAddress || '-',
          'Marital Status': verification.maritalStatus || '-',
          'Place of Birth': verification.placeOfBirth || '-',
          'Father Name': verification.fatherName || '-',
          'Father Age': verification.fatherAge || '-',
          'Father Status': verification.fatherStatus || '-',
          'Mother Name': verification.motherName || '-',
          'Mother Age': verification.motherAge || '-',
          'Mother Status': verification.motherStatus || '-',
          'Spouse Name': verification.spouseName || '-',
          'Spouse Age': verification.spouseAge || '-',
          'Nominee Name': verification.nomineeName || '-',
          'Nominee Relation': verification.nomineeRelation || '-',
          'Nominee DOB': verification.nomineeDOB || '-',
          'Relationship with Proposer': verification.relationshipWithProposer || '-',
          'LA Name': verification.laName || '-',
          'LA DOB': verification.laDob || '-',
          'LA Father Name': verification.laFatherName || '-',
          'LA Father DOB': verification.laFatherDob || '-',
          'LA Mother Name': verification.laMotherName || '-',
          'LA Mother DOB': verification.laMotherDob || '-',
          'Age': verification.age || '-',
          'Height (Ft)': verification.heightFt || '-',
          'Height (In)': verification.heightIn || '-',
          'Weight': verification.weight || '-',
          'Designation': verification.designation || '-',
          'Existing Policy': verification.existingPolicy || '-',
          'Premium Amount': verification.premiumAmount || '-',
          'PAN Number': verification.panNumber || '-',
          'Aadhar Number': verification.aadharNumber || '-',
        };
      } else if (verification.insuranceType === 'car_insurance') {
        insuranceSpecificData = {
          'Vehicle Type': verification.vehicleType || '-',
          'Policy Cover': verification.policyCover || '-',
          'Registration Number': verification.registrationNumber || '-',
          'Registration Month': verification.registrationMonth || '-',
          'Registration Year': verification.registrationYear || '-',
          'Vehicle Brand': verification.vehicleBrand || '-',
          'Fuel Type': verification.fuelType || '-',
          'Vehicle Variant': verification.vehicleVariant || '-',
          'City': verification.city || '-',
          'Pincode': verification.pincode || '-',
          'Is Bharat Series': verification.isBharatSeries ? 'Yes' : 'No',
          'Has Previous Claim': verification.hasPreviousClaim || '-',
          'Previous Policy Type': verification.previousPolicyType || '-',
          'Previous Policy Expiry Date': verification.previousPolicyExpiryDate || '-',
          'Existing Policy NCB': verification.existingPolicyNCB || '-',
          'Previous Insurer Name': verification.previousInsurerName || '-',
        };
      }

      // Add document counts
      const documentData = {
        'Proposer Documents Count': verification.documents?.proposerDocuments?.length || 0,
        'Payment Documents Count': verification.paymentDocuments?.length || 0,
        'Verification Documents Count': verification.verificationDocuments?.length || 0,
      };

      // Add remarks
      const remarksData = {
        'Remarks Count': verification.remarks?.length || 0,
        'Latest Remark': verification.remarks?.length > 0 ? verification.remarks[verification.remarks.length - 1].text : '-',
        'Latest Remark User': verification.remarks?.length > 0 ? verification.remarks[verification.remarks.length - 1].user : '-',
        'Latest Remark Date': verification.remarks?.length > 0 ? new Date(verification.remarks[verification.remarks.length - 1].timestamp).toLocaleDateString() : '-',
      };

      return {
        ...baseData,
        ...insuranceSpecificData,
        ...documentData,
        ...remarksData
      };
    });

    return NextResponse.json(exportData);
  } catch (error) {
    console.error('Error fetching verification data for export:', error);
    return NextResponse.json(
      { error: 'Failed to fetch verification data for export' },
      { status: 500 }
    );
  }
} 