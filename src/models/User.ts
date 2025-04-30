import mongoose from 'mongoose';

export enum UserRole {
  ADMIN = 'admin',
  SALES_MANAGER = 'sales_manager',
  SALES_EXECUTIVE = 'sales_executive'
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
  User = mongoose.model('User');
} catch {
  User = mongoose.model('User', userSchema);
}

export { User }; 