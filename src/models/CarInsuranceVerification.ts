import mongoose, { Schema, Document } from 'mongoose';

export interface ICarInsuranceVerification extends Document {
  leadId: mongoose.Types.ObjectId;
  status: 'submitted' | 'processing' | 'link_created' | 'payment_done' | 'PLVC_verification' | 'PLVC_done';
  insuranceType: string;
  
  // Company Selection
  selectedCompany: string;
  
  // Vehicle Details
  vehicleType: string;
  policyCover: string;
  registrationNumber: string;
  registrationMonth: string;
  registrationYear: string;
  vehicleBrand: string;
  fuelType: string;
  vehicleVariant: string;
  city: string;
  pincode: string;
  isBharatSeries: boolean;
  hasPreviousClaim: string;
  
  // Previous Policy Details
  previousPolicyType: 'used_vehicle' | 'name_transfer' | 'unknown' | 'none';
  previousPolicyExpiryDate: string;
  existingPolicyNCB: string;
  previousInsurerName: string;
  
  // Documents
  panCard: string;
  aadharCard: string;
  rcCopy: string;
  policyCopy: string;
  plvcVideo: string;

  createdAt: Date;
  updatedAt: Date;

  remarks?: Array<{
    text: string;
    user: string;
    timestamp: Date;
  }>;

  paymentScreenshot?: string;
}

const CarInsuranceVerificationSchema = new Schema({
  leadId: { type: Schema.Types.ObjectId, ref: 'Lead', required: true },
  status: {
    type: String,
    enum: ['submitted', 'processing', 'link_created', 'payment_done', 'PLVC_verification', 'PLVC_done'],
    default: 'submitted'
  },
  insuranceType: { type: String, default: 'car_insurance' },

  // Company Selection
  selectedCompany: { type: String, required: true },

  // Vehicle Details
  vehicleType: { type: String, required: true },
  policyCover: { type: String, required: true },
  registrationNumber: { type: String, required: true },
  registrationMonth: { type: String, required: true },
  registrationYear: { type: String, required: true },
  vehicleBrand: { type: String, required: true },
  fuelType: { type: String, required: true },
  vehicleVariant: { type: String, required: true },
  city: { type: String, required: true },
  pincode: { type: String, required: true },
  isBharatSeries: { type: Boolean, default: false },
  hasPreviousClaim: { type: String, required: true },

  // Previous Policy Details
  previousPolicyType: {
    type: String,
    enum: ['used_vehicle', 'name_transfer', 'unknown', 'none'],
    default: 'none'
  },
  previousPolicyExpiryDate: { type: String },
  existingPolicyNCB: { type: String },
  previousInsurerName: { type: String },

  // Documents
  panCard: { type: String, required: true },
  aadharCard: { type: String, required: true },
  rcCopy: { type: String, required: true },
  policyCopy: { type: String },
  plvcVideo: { type: String },

  remarks: [
    {
      text: { type: String, required: true },
      user: { type: String, required: true },
      timestamp: { type: Date, default: Date.now }
    }
  ],

  paymentScreenshot: { type: String },

}, {
  timestamps: true
});

// Add indexes for better query performance
CarInsuranceVerificationSchema.index({ leadId: 1 });
CarInsuranceVerificationSchema.index({ status: 1 });
CarInsuranceVerificationSchema.index({ createdAt: 1 });

export default mongoose.models.CarInsuranceVerification || mongoose.model<ICarInsuranceVerification>('CarInsuranceVerification', CarInsuranceVerificationSchema); 