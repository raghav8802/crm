import mongoose, { Schema, Document } from 'mongoose';

export interface ITermInsuranceVerification extends Document {
  leadId: mongoose.Types.ObjectId;
  status: 'submitted' | 'processing' | 'link_created' | 'payment_done' | 'PLVC_verification' | 'PLVC_done' | 'pending' | 'approved' | 'rejected';
  insuranceType: 'term_insurance';
  
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

  // Insurance Details
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

  // Policy Management (Payment Coordinator Fields)
  policyIssueDate?: string;
  renewalType?: 'Monthly' | 'Quarterly' | 'Half Yearly' | 'Yearly';

  // NEW DOCUMENT STRUCTURE
  documents: Array<{
    documentType: 'PAN' | 'Aadhaar' | 'Photo' | 'Cancelled Cheque' | 'Bank Statement' | 'Other';
    files: Array<{
      url: string;
      fileName: string;
    }>;
  }>;

  paymentDocuments: Array<{
    documentType: 'Payment Screenshot' | 'BI File';
    files: Array<{
      url: string;
      fileName: string;
    }>;
  }>;

  verificationDocuments: VerificationDocumentGroup[];

  // Documents (keep panNumber and aadharNumber)
  panNumber: string;
  aadharNumber: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface VerificationDocumentGroup {
  documentType: 'Sales Audio' | 'Verification Call' | 'Welcome Call';
  files: Array<{
    fileType: 'audio' | 'video';
    url: string;
    fileName: string;
  }>;
}

const fileSchema = new Schema({
  url: { type: String, required: true },
  fileName: { type: String, required: true }
}, { _id: false });

const verificationFileSchema = new Schema({
  fileType: { type: String, enum: ['audio', 'video'], required: true },
  url: { type: String, required: true },
  fileName: { type: String, required: true }
}, { _id: false });

const TermInsuranceVerificationSchema = new Schema({
  leadId: {
    type: Schema.Types.ObjectId,
    ref: 'Lead',
    required: true
  },
  status: {
    type: String,
    enum: ['submitted', 'processing', 'link_created', 'payment_done', 'PLVC_verification', 'PLVC_done', 'pending', 'approved', 'rejected'],
    default: 'submitted'
  },
  insuranceType: {
    type: String,
    enum: ['term_insurance'],
    default: 'term_insurance'
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
  sumAssured: String,
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
  laProposal: String,
  laName: String,
  laDob: String,
  age: String,
  heightFt: String,
  heightIn: String,
  weight: String,
  designation: String,
  existingPolicy: String,
  premiumAmount: String,
  remarks: [{
    text: String,
    user: String,
    timestamp: { type: Date, default: Date.now }
  }],

  // Policy Management (Payment Coordinator Fields)
  policyIssueDate: String,
  renewalType: {
    type: String,
    enum: ['Monthly', 'Quarterly', 'Half Yearly', 'Yearly']
  },

  // NEW DOCUMENT STRUCTURE
  documents: [{
    documentType: { type: String, enum: ['PAN', 'Aadhaar', 'Photo', 'Cancelled Cheque', 'Bank Statement', 'Other'], required: true },
    files: [fileSchema]
  }],
  paymentDocuments: [{
    documentType: { type: String, enum: ['Payment Screenshot', 'BI File'], required: true },
    files: [fileSchema]
  }],
  verificationDocuments: [{
    documentType: { type: String, enum: ['Sales Audio', 'Verification Call', 'Welcome Call'], required: true },
    files: [verificationFileSchema]
  }],

  // Documents (keep panNumber and aadharNumber)
  panNumber: String,
  aadharNumber: String,

  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, {
  timestamps: true
});

// Create indexes for better query performance
TermInsuranceVerificationSchema.index({ leadId: 1 });
TermInsuranceVerificationSchema.index({ status: 1 });
TermInsuranceVerificationSchema.index({ createdAt: 1 });

// Update the updatedAt timestamp before saving
TermInsuranceVerificationSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.TermInsuranceVerification || mongoose.model<ITermInsuranceVerification>('TermInsuranceVerification', TermInsuranceVerificationSchema); 