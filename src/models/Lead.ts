import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  altNumber: { type: String, default: '' },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], default: '' },
  dateOfBirth: { type: String, default: '' },
  age: { type: String, default: '' },
  tabacoUser: { type: String, enum: ['yes', 'no'], default: 'no' },
  annualIncome: { type: String, default: '' },
  occupation: { type: String, default: '' },
  education: { type: String, enum: ['12', 'Graduate', 'Postgraduate', 'PhD'], default: '12' },
  address: { type: String, default: '' },
  status: { type: String, enum: ['Fresh', 'Interested', 'Callback Later', 'Wrong Number', 'Won', 'Lost'], default: 'Fresh' },
  notes: { type: [String], default: [] },
  assignedTo: { type: String, default: '' },
  assignedFrom: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Update the updatedAt timestamp before saving
leadSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export const Lead = mongoose.models.Lead || mongoose.model('Lead', leadSchema);

export type LeadType = {
  _id?: string;
  name: string;
  email: string;
  phoneNumber: string;
  altNumber?: string;
  gender?: 'Male' | 'Female' | 'Other';
  dateOfBirth?: string;
  age?: string;
  tabacoUser?: 'yes' | 'no';
  annualIncome?: string;
  occupation?: string;
  education?: '12' | 'Graduate' | 'Postgraduate' | 'PhD';
  address?: string;
  status?: 'Fresh' | 'Interested' | 'Callback Later' | 'Wrong Number' | 'Won' | 'Lost';
  notes?: string[];
  assignedTo?: string;
  assignedFrom?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

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

export interface UpdateLeadDto extends Partial<CreateLeadDto> {} 