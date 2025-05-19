import mongoose from 'mongoose';

export interface TermInsuranceType {
  _id?: string;
  leadId: string;
  insuranceType: 'Term Insurance';
  status: 'Submitted' | 'Under Review' | 'Approved' | 'Rejected';
  selectedCompany: string;
  
  // Step 1 - Personal Information
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

  // Step 2 - Family Information
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

  // Step 3 - Insurance Details
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

  // Step 4 - Documents
  panNumber: string;
  panPhoto: string;
  aadharNumber: string;
  aadharPhoto: string;
  userPhoto: string;
  cancelledCheque: string;
  bankStatement: string;

  // Metadata
  createdAt?: Date;
  updatedAt?: Date;
}

const termInsuranceSchema = new mongoose.Schema({
  leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true },
  insuranceType: { type: String, default: 'Term Insurance', required: true },
  status: { type: String, enum: ['Submitted', 'Under Review', 'Approved', 'Rejected'], default: 'Submitted' },
  selectedCompany: { type: String, required: true },
  
  // Step 1 - Personal Information
  name: { type: String, required: true },
  mobileNo: { type: String, required: true },
  alternateNo: { type: String, required: true },
  email: { type: String, required: true },
  dateOfBirth: { type: String, required: true },
  education: { type: String, required: true },
  occupation: { type: String, enum: ['Job', 'Business', 'Self Employed', 'Student', 'Housewife'], required: true },
  organizationName: { type: String, required: true },
  workBelongsTo: { type: String, required: true },
  annualIncome: { type: String, required: true },
  yearsOfWorking: { type: String, required: true },
  currentAddress: { type: String, required: true },
  permanentAddress: { type: String, required: true },
  maritalStatus: { type: String, enum: ['Single', 'Married'], required: true },
  placeOfBirth: { type: String, required: true },

  // Step 2 - Family Information
  fatherName: { type: String, required: true },
  fatherAge: { type: String, required: true },
  fatherStatus: { type: String, enum: ['Alive', 'Dead'], required: true },
  motherName: { type: String, required: true },
  motherAge: { type: String, required: true },
  motherStatus: { type: String, enum: ['Alive', 'Dead'], required: true },
  spouseName: { type: String, required: true },
  spouseAge: { type: String, required: true },
  nomineeName: { type: String, required: true },
  nomineeRelation: { type: String, required: true },
  nomineeDOB: { type: String, required: true },

  // Step 3 - Insurance Details
  laProposal: { type: String, required: true },
  laName: { type: String, required: true },
  laDob: { type: String, required: true },
  age: { type: String, required: true },
  heightFt: { type: String, required: true },
  heightIn: { type: String, required: true },
  weight: { type: String, required: true },
  designation: { type: String, required: true },
  existingPolicy: { type: String, required: true },
  premiumAmount: { type: String, required: true },
  remarks: { type: String, required: true },

  // Step 4 - Documents
  panNumber: { type: String, required: true },
  panPhoto: { type: String, required: true },
  aadharNumber: { type: String, required: true },
  aadharPhoto: { type: String, required: true },
  userPhoto: { type: String, required: true },
  cancelledCheque: { type: String, required: true },
  bankStatement: { type: String, required: true },
}, { timestamps: true });

export const TermInsurance = mongoose.models.TermInsurance || mongoose.model('TermInsurance', termInsuranceSchema); 