import mongoose from 'mongoose';

export interface VerificationDocumentType {
  _id?: string;
  leadId: string;
  panCard?: string;
  aadharCard?: string;
  photo?: string;
  cancelledCheque?: string;
  bankStatement?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const verificationDocumentSchema = new mongoose.Schema({
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead',
    required: true
  },
  panCard: {
    type: String,
    required: false
  },
  aadharCard: {
    type: String,
    required: false
  },
  photo: {
    type: String,
    required: false
  },
  cancelledCheque: {
    type: String,
    required: false
  },
  bankStatement: {
    type: String,
    required: false
  }
}, {
  timestamps: true
});

export const VerificationDocument = mongoose.models.VerificationDocument || 
  mongoose.model('VerificationDocument', verificationDocumentSchema); 