import mongoose from 'mongoose';

export interface LeadType {
  _id?: string;
  name: string;
  email?: string;
  phoneNumber: string;
  altNumber?: string;
  gender?: 'Male' | 'Female' | 'Other';
  dateOfBirth?: string;
  age?: string;
  tabacoUser?: 'yes' | 'no';
  annualIncome?: string;
  occupation?: string;
  education?: '10th' | '12th' | 'Graduate' | 'Post Graduate' | 'Other';
  address?: string;
  status: 'Fresh' | 'Interested' | 'Ringing' | 'Follow Up' | 'Call Disconnected' | 'Callback Later' | 'Wrong Number' | 'Won' | 'Lost';
  notes: string[];
  assignedTo?: string;
  assignedFrom?: string;
  thread: {
    action: string;
    details: string;
    performedBy: string;
    timestamp: Date;
  }[];
  createdAt?: Date;
  updatedAt?: Date;
  callbackTime?: Date;
  source?: string;
}

const leadSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  email: { type: String, required: true },
  altNumber: { type: String },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  dateOfBirth: { type: String, required: true },
  age: { type: String, required: true },
  tabacoUser: { type: String, enum: ['yes', 'no']},
  annualIncome: { type: String },
  occupation: { type: String},
  education: { type: String, enum: ['10th', '12th', 'Graduate', 'Post Graduate', 'Other']},
  address: { type: String},
  status: { type: String, enum: ['Fresh', 'Interested', 'Ringing', 'Follow Up', 'Call Disconnected', 'Callback Later', 'Wrong Number', 'Sale Done', 'Lost'], required: true, default: 'Fresh' },
  notes: [{ type: String }],
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedFrom: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  thread: [{
    action: String,
    details: String,
    performedBy: String,
    timestamp: { type: Date, default: Date.now },
  }],
  source: { type: String, required: false },
}, { timestamps: true });

export const Lead = mongoose.models.Lead || mongoose.model('Lead', leadSchema);

export interface CreateLeadDto {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  title?: string;
  status?: 'New' | 'Contacted' | 'Qualified' | 'Lost';
  source?: 'Website' | 'Referral' | 'Social' | 'Other';
  assignedTo?: string;
  notes?: string;
} 