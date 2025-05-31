import mongoose from 'mongoose';

export enum UserRole {
  ADMIN = 'admin',
  SALES_MANAGER = 'sales_manager',
  PAYMENT_COORDINATOR = 'Payment_Coordinator',
  PLVC_VERIFICATOR = 'PLVC_verificator',
  MIS = 'MIS'
}

export interface UserType {
  _id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: Object.values(UserRole),
    required: true,
  }
}, {
  timestamps: true
});

// Check if the model exists before creating it
let User: mongoose.Model<UserType>;
try {
  User = mongoose.model('User') as mongoose.Model<UserType>;
} catch {
  User = mongoose.model<UserType>('User', userSchema);
}

export { User }; 