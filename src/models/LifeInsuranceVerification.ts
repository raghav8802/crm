import mongoose, { Schema, Document } from 'mongoose';

export interface ILifeInsuranceVerification extends Document {
  leadId: mongoose.Types.ObjectId;
  status: 'submitted' | 'processing' | 'link_created' | 'payment_done' | 'PLVC_verification' | 'PLVC_done';
  insuranceType: 'life_insurance';
  
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
  incomePayoutOption: 'Advance' | 'Arrears';
  incomePayoutMode: 'Annual' | 'Semi Annual' | 'Quarterly' | 'Monthly';
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

  // Documents
  // Proposer Documents
  proposerPanNumber: string;
  proposerPanPhoto: string; // URL or path to stored file
  proposerAadharNumber: string;
  proposerAadharPhoto: string; // URL or path to stored file
  proposerPhoto: string; // URL or path to stored file
  proposerCancelledCheque: string; // URL or path to stored file
  proposerBankStatement: string; // URL or path to stored file
  proposerOtherDocument: string; // URL or path to stored file

  // LA Documents
  laPanNumber: string;
  laPanPhoto: string; // URL or path to stored file
  laAadharNumber: string;
  laAadharPhoto: string; // URL or path to stored file
  laPhoto: string; // URL or path to stored file
  laCancelledCheque: string; // URL or path to stored file
  laBankStatement: string; // URL or path to stored file
  laOtherDocument: string; // URL or path to stored file

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const LifeInsuranceVerificationSchema = new Schema({
  leadId: {
    type: Schema.Types.ObjectId,
    ref: 'Lead',
    required: true
  },
  status: {
    type: String,
    enum: ['submitted', 'processing', 'link_created', 'payment_done', 'PLVC_verification', 'PLVC_done'],
    default: 'submitted'
  },
  insuranceType: {
    type: String,
    enum: ['life_insurance'],
    default: 'life_insurance'
  },

  // Initial Selection
  residentialStatus: {
    type: String,
    enum: ['Indian', 'NRI']
  },
  nationality: {
    type: String,
    enum: ['Indian', 'NRI']
  },
  policyFor: {
    type: String,
    enum: ['Self', 'Dependent', 'Business']
  },

  // Company Selection
  selectedCompany: String,

  // Product Details
  productName: String,
  pt: String,
  ppt: String,
  planVariant: String,
  premium: String,
  isSmoker: {
    type: String,
    enum: ['Yes', 'No']
  },
  modeOfPayment: {
    type: String,
    enum: ['Annual', 'Semi Annual', 'Quarterly', 'Monthly']
  },
  premiumPaymentMethod: {
    type: String,
    enum: ['Single', 'Regular', 'Pay Till 60', 'Limited Pay']
  },
  incomePayoutOption: {
    type: String,
    enum: ['Advance', 'Arrears']
  },
  incomePayoutMode: {
    type: String,
    enum: ['Annual', 'Semi Annual', 'Quarterly', 'Monthly']
  },
  rider: String,

  // Personal Details
  name: String,
  mobileNo: String,
  alternateNo: String,
  email: String,
  dateOfBirth: String,
  education: String,
  occupation: {
    type: String,
    enum: ['Job', 'Business', 'Self Employed', 'Student', 'Housewife', 'Other']
  },
  organizationName: String,
  workBelongsTo: String,
  annualIncome: String,
  yearsOfWorking: String,
  currentAddress: String,
  permanentAddress: String,
  maritalStatus: {
    type: String,
    enum: ['Single', 'Married']
  },
  placeOfBirth: String,

  // Family Details
  fatherName: String,
  fatherAge: String,
  fatherStatus: {
    type: String,
    enum: ['Alive', 'Dead']
  },
  motherName: String,
  motherAge: String,
  motherStatus: {
    type: String,
    enum: ['Alive', 'Dead']
  },
  spouseName: String,
  spouseAge: String,
  nomineeName: String,
  nomineeRelation: String,
  nomineeDOB: String,

  // Insurance Details
  relationshipWithProposer: String,
  laName: String,
  laDob: String,
  age: String,
  heightFt: String,
  heightIn: String,
  weight: String,
  designation: String,
  existingPolicy: String,
  premiumAmount: String,
  remarks: String,

  // Documents
  // Proposer Documents
  proposerPanNumber: String,
  proposerPanPhoto: String,
  proposerAadharNumber: String,
  proposerAadharPhoto: String,
  proposerPhoto: String,
  proposerCancelledCheque: String,
  proposerBankStatement: String,
  proposerOtherDocument: String,

  // LA Documents
  laPanNumber: String,
  laPanPhoto: String,
  laAadharNumber: String,
  laAadharPhoto: String,
  laPhoto: String,
  laCancelledCheque: String,
  laBankStatement: String,
  laOtherDocument: String
}, {
  timestamps: true
});

// Create indexes for better query performance
LifeInsuranceVerificationSchema.index({ leadId: 1 });
LifeInsuranceVerificationSchema.index({ status: 1 });
LifeInsuranceVerificationSchema.index({ createdAt: 1 });

export default mongoose.models.LifeInsuranceVerification || mongoose.model<ILifeInsuranceVerification>('LifeInsuranceVerification', LifeInsuranceVerificationSchema); 