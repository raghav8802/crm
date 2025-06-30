import mongoose, { Schema, Document } from 'mongoose';

export interface IHealthInsuranceVerification extends Document {
  leadId: mongoose.Types.ObjectId;
  status: 'submitted' | 'processing' | 'link_created' | 'payment_done' | 'PLVC_verification' | 'PLVC_done';
  insuranceType: 'health_insurance';
  
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
  proposerHeight: string;
  proposerWeight: string;

  // Insured Persons
  insuredPersons: Array<{
    name: string;
    dob: string;
    gender: string;
    relationship: string;
    height: string;
    weight: string;
    aadharNumber: string;
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
  }>;

  // Nominee Details
  nomineeName: string;
  nomineeRelation: string;
  nomineeDOB: string;

  // Remarks
  remarks: Array<{
    text: string;
    user: string;
    timestamp: Date;
  }>;

  // NEW STRUCTURED DOCUMENT MANAGEMENT
  documents: {
    proposerDocuments: Array<{
      documentType: 'PAN' | 'Aadhaar' | 'Photo' | 'Cancelled Cheque' | 'Bank Statement' | 'Other';
      files: Array<{
        url: string;
        fileName: string;
      }>;
    }>;
    insuredPersonsDocuments: Array<{
      personIndex: number;
      documents: Array<{
        documentType: 'Aadhaar' | 'Medical Documents';
        files: Array<{
          url: string;
          fileName: string;
        }>;
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

const HealthInsuranceVerificationSchema = new Schema({
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
    enum: ['health_insurance'],
    default: 'health_insurance' 
  },

  // Company Selection
  selectedCompany: { type: String },

  // Policy Details
  manufacturerName: { type: String },
  planName: { type: String },
  premium: { type: String },
  ptPpt: { type: String },
  mode: { type: String },
  portFresh: { type: String },
  sumInsured: { type: String },
  sumInsuredType: { type: String },
  rider: { type: String },

  // Proposer Details
  proposerName: { type: String },
  proposerMobile: { type: String },
  proposerEmail: { type: String },
  proposerAddress: { type: String },
  proposerAnnualIncome: { type: String },
  proposerPanNumber: { type: String },
  proposerHeight: { type: String },
  proposerWeight: { type: String },

  // Insured Persons
  insuredPersons: [{
    name: { type: String },
    dob: { type: String },
    gender: { type: String },
    relationship: { type: String },
    height: { type: String },
    weight: { type: String },
    aadharNumber: { type: String },
    medicalHistory: { type: String },
    preExistingDisease: { type: String },
    bpDiabetes: { type: String },
    currentProblems: { type: String },
    disclosureDate: { type: String },
    medicineName: { type: String },
    medicineDose: { type: String },
    drinking: { type: String, enum: ['Yes', 'No'], default: 'No' },
    smoking: { type: String, enum: ['Yes', 'No'], default: 'No' },
    chewing: { type: String, enum: ['Yes', 'No'], default: 'No' }
  }],

  // Nominee Details
  nomineeName: { type: String },
  nomineeRelation: { type: String },
  nomineeDOB: { type: String },

  // Remarks
  remarks: [{
    text: { type: String },
    user: { type: String },
    timestamp: { type: Date, default: Date.now }
  }],

  // NEW STRUCTURED DOCUMENT MANAGEMENT
  documents: {
    proposerDocuments: [{
      documentType: { 
        type: String, 
        enum: ['PAN', 'Aadhaar', 'Photo', 'Cancelled Cheque', 'Bank Statement', 'Other'] 
      },
      files: [fileSchema]
    }],
    insuredPersonsDocuments: [{
      personIndex: { type: Number },
      documents: [{
        documentType: { 
          type: String, 
          enum: ['Aadhaar', 'Medical Documents'] 
        },
        files: [fileSchema]
      }]
    }]
  },

  paymentDocuments: [{
    documentType: { 
      type: String, 
      enum: ['Payment Screenshot', 'BI File'] 
    },
    files: [fileSchema]
  }],

  verificationDocuments: [{
    documentType: { 
      type: String, 
      enum: ['Sales Audio', 'Verification Call', 'Welcome Call'] 
    },
    files: [verificationFileSchema]
  }],

  // For search/filter
  panNumber: { type: String },
  aadharNumber: { type: String }
}, {
  timestamps: true
});

// Add indexes for better query performance
HealthInsuranceVerificationSchema.index({ leadId: 1 });
HealthInsuranceVerificationSchema.index({ status: 1 });
HealthInsuranceVerificationSchema.index({ createdAt: 1 });

export default mongoose.models.HealthInsuranceVerification || mongoose.model<IHealthInsuranceVerification>('HealthInsuranceVerification', HealthInsuranceVerificationSchema); 