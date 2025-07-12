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
  incomePayoutOption: 'Advance' | 'Arrears' | 'None';
  incomePayoutMode: 'Annual' | 'Semi Annual' | 'Quarterly' | 'Monthly' | 'Lumpsum';
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
  laFatherName: string;
  laFatherDob: string;
  laMotherName: string;
  laMotherDob: string;
  age: string;
  heightFt: string;
  heightIn: string;
  weight: string;
  designation: string;
  existingPolicy: string;
  premiumAmount: string;
  remarks: string;

  // New Document Structure
  documents: {
    proposerDocuments: Array<{
      documentType: 'PAN' | 'Aadhaar' | 'Photo' | 'Cancelled Cheque' | 'Bank Statement' | 'Other';
      files: Array<{
        url: string;
        fileName: string;
      }>;
    }>;
    laDocuments: Array<{
      documentType: 'PAN' | 'Aadhaar' | 'Photo' | 'Cancelled Cheque' | 'Bank Statement' | 'Other';
      files: Array<{
        url: string;
        fileName: string;
      }>;
    }>;
  };
  paymentDocuments: Array<{
    documentType: 'Payment Screenshot' | 'BI File';
    files: Array<{
      url: string;
      fileName: string;
    }>;
  }>;
  verificationDocuments: Array<{
    documentType: 'Sales Audio' | 'Verification Call' | 'Welcome Call';
    files: Array<{
      fileType: 'audio' | 'video';
      url: string;
      fileName: string;
    }>;
  }>;

  // For search/filter
  panNumber: string;
  aadharNumber: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
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
    enum: ['Advance', 'Arrears', 'None']
  },
  incomePayoutMode: {
    type: String,
    enum: ['Annual', 'Semi Annual', 'Quarterly', 'Monthly', 'Lumpsum']
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
  laFatherName: String,
  laFatherDob: String,
  laMotherName: String,
  laMotherDob: String,
  age: String,
  heightFt: String,
  heightIn: String,
  weight: String,
  designation: String,
  existingPolicy: String,
  premiumAmount: String,
  remarks: String,

  // New Document Structure
  documents: {
    proposerDocuments: [
      {
        documentType: { type: String, enum: ['PAN', 'Aadhaar', 'Photo', 'Cancelled Cheque', 'Bank Statement', 'Other'], required: true },
        files: [fileSchema]
      }
    ],
    laDocuments: [
      {
        documentType: { type: String, enum: ['PAN', 'Aadhaar', 'Photo', 'Cancelled Cheque', 'Bank Statement', 'Other'], required: true },
        files: [fileSchema]
      }
    ]
  },
  paymentDocuments: [
    {
      documentType: { type: String, enum: ['Payment Screenshot', 'BI File'], required: true },
      files: [fileSchema]
    }
  ],
  verificationDocuments: [
    {
      documentType: { type: String, enum: ['Sales Audio', 'Verification Call', 'Welcome Call'], required: true },
      files: [verificationFileSchema]
    }
  ],

  // For search/filter
  panNumber: String,
  aadharNumber: String,
}, {
  timestamps: true
});

// Create indexes for better query performance
LifeInsuranceVerificationSchema.index({ leadId: 1 });
LifeInsuranceVerificationSchema.index({ status: 1 });
LifeInsuranceVerificationSchema.index({ createdAt: 1 });

export default mongoose.models.LifeInsuranceVerification || mongoose.model<ILifeInsuranceVerification>('LifeInsuranceVerification', LifeInsuranceVerificationSchema); 