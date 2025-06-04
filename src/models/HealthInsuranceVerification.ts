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
  leadId: { type: Schema.Types.ObjectId, ref: 'Lead' },
  status: {
    type: String,
    enum: ['submitted', 'processing', 'link_created', 'payment_done', 'PLVC_verification', 'PLVC_done'],
    default: 'submitted'
  },
  insuranceType: { type: String, default: 'health_insurance' },

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
  proposerPanImage: { type: String },
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
    aadharPhoto: { type: String },
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
  nomineeName: { type: String },
  nomineeRelation: { type: String },
  nomineeDOB: { type: String },

  // Remarks
  remarks: [{
    text: { type: String },
    user: { type: String },
    timestamp: { type: Date, default: Date.now }
  }],

  // PLVC Verification Video
  plvcVideo: { type: String }
}, {
  timestamps: true
});

// Add indexes for better query performance
HealthInsuranceVerificationSchema.index({ leadId: 1 });
HealthInsuranceVerificationSchema.index({ status: 1 });
HealthInsuranceVerificationSchema.index({ createdAt: 1 });

export default mongoose.models.HealthInsuranceVerification || mongoose.model<IHealthInsuranceVerification>('HealthInsuranceVerification', HealthInsuranceVerificationSchema); 