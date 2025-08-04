import mongoose from 'mongoose';

export interface IAttendance {
  userId: string;
  date: string;
  checkIn: string;
  checkOut?: string;
  totalHours?: number;
  status: 'present' | 'absent' | 'late';
  checkInPhoto?: string;
  checkOutPhoto?: string;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceSchema = new mongoose.Schema<IAttendance>({
  userId: { type: String, required: true },
  date: { type: String, required: true },
  checkIn: { type: String, required: true },
  checkOut: { type: String },
  totalHours: { type: Number },
  status: { type: String, enum: ['present', 'absent', 'late'], default: 'present' },
  checkInPhoto: { type: String },
  checkOutPhoto: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Create a unique compound index on userId and date
attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

const Attendance = mongoose.models.Attendance || mongoose.model('Attendance', attendanceSchema) as any;

export default Attendance; 