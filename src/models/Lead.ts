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
  status: 'Fresh' | 'Interested' | 'Callback Later' | 'Wrong Number' | 'Won' | 'Lost';
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
}

const leadSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  email: {
    type: String,
  },
  status: {
    type: String,
    enum: ['Fresh', 'Interested', 'Callback Later', 'Wrong Number', 'Won', 'Lost'],
    default: 'Fresh',
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  notes: [{
    type: String,
  }],
  thread: [{
    action: String,
    details: String,
    performedBy: String,
    timestamp: {
      type: Date,
      default: Date.now,
    },
  }],
}, {
  timestamps: true,
});

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