import mongoose, { Schema, Document } from 'mongoose';

export interface ITermInsuranceVerification extends Document {
  leadId: mongoose.Types.ObjectId;
  status: 'submitted' | 'pending' | 'approved' | 'rejected';
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
  plvcVideo: string;

  // Documents
  panNumber: string;
  panPhoto: string; // URL or path to stored file
  aadharNumber: string;
  aadharPhoto: string; // URL or path to stored file
  userPhoto: string; // URL or path to stored file
  cancelledCheque: string; // URL or path to stored file
  bankStatement: string; // URL or path to stored file
  otherDocument: string; // URL or path to stored file

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Payment Screenshot
  paymentScreenshot: string;
}

const TermInsuranceVerificationSchema = new Schema({
  leadId: {
    type: Schema.Types.ObjectId,
    ref: 'Lead',
    required: true
  },
  status: {
    type: String,
    enum: ['submitted', 'pending', 'approved', 'rejected'],
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
  plvcVideo: String,

  // Documents
  panNumber: String,
  panPhoto: String,
  aadharNumber: String,
  aadharPhoto: String,
  userPhoto: String,
  cancelledCheque: String,
  bankStatement: String,
  otherDocument: String,

  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },

  // Payment Screenshot
  paymentScreenshot: String
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