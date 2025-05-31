import mongoose, { Schema, Document } from 'mongoose';

export interface IHealthInsuranceVerification extends Document {
  leadId: mongoose.Types.ObjectId;
  status: 'submitted' | 'processing' | 'link_created' | 'payment_done' | 'PLVC_verification' | 'PLVC_done';
  insuranceType: string;
  
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
  proposerPanImage: string;
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
    aadharPhoto: string;
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

  // PLVC Verification Video
  plvcVideo?: string;

  createdAt: Date;
  updatedAt: Date;
}

const HealthInsuranceVerificationSchema = new Schema({
  leadId: { type: Schema.Types.ObjectId, ref: 'Lead', required: true },
  status: {
    type: String,
    enum: ['submitted', 'processing', 'link_created', 'payment_done', 'PLVC_verification', 'PLVC_done'],
    default: 'submitted'
  },
  insuranceType: { type: String, default: 'health_insurance' },

  // Company Selection
  selectedCompany: { type: String, required: true },

  // Policy Details
  manufacturerName: { type: String },
  planName: { type: String, required: true },
  premium: { type: String, required: true },
  ptPpt: { type: String, required: true },
  mode: { type: String, required: true },
  portFresh: { type: String, required: true },
  sumInsured: { type: String, required: true },
  sumInsuredType: { type: String, required: true },
  rider: { type: String },

  // Proposer Details
  proposerName: { type: String, required: true },
  proposerMobile: { type: String, required: true },
  proposerEmail: { type: String, required: true },
  proposerAddress: { type: String, required: true },
  proposerAnnualIncome: { type: String, required: true },
  proposerPanNumber: { type: String, required: true },
  proposerPanImage: { type: String, required: true },
  proposerHeight: { type: String, required: true },
  proposerWeight: { type: String, required: true },

  // Insured Persons
  insuredPersons: [{
    name: { type: String, required: true },
    dob: { type: String, required: true },
    gender: { type: String, required: true },
    relationship: { type: String, required: true },
    height: { type: String, required: true },
    weight: { type: String, required: true },
    aadharNumber: { type: String, required: true },
    aadharPhoto: { type: String, required: true },
    medicalHistory: { type: String },
    preExistingDisease: { type: String },
    bpDiabetes: { type: String },
    currentProblems: { type: String },
    disclosureDate: { type: String },
    medicineName: { type: String },
    medicineDose: { type: String },
    drinking: { type: String, enum: ['Yes', 'No'], default: 'No' },
    smoking: { type: String, enum: ['Yes', 'No'], default: 'No' },
    chewing: { type: String, enum: ['Yes', 'No'], default: 'No' },
    medicalDocuments: [{ type: String }]
  }],

  // Nominee Details
  nomineeName: { type: String, required: true },
  nomineeRelation: { type: String, required: true },
  nomineeDOB: { type: String, required: true },

  // Remarks
  remarks: [{
    text: { type: String, required: true },
    user: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }],

  // PLVC Verification Video
  plvcVideo: { type: String },
}, {
  timestamps: true
});

// Add indexes for better query performance
HealthInsuranceVerificationSchema.index({ leadId: 1 });
HealthInsuranceVerificationSchema.index({ status: 1 });
HealthInsuranceVerificationSchema.index({ createdAt: 1 });

export default mongoose.models.HealthInsuranceVerification || mongoose.model<IHealthInsuranceVerification>('HealthInsuranceVerification', HealthInsuranceVerificationSchema); 