import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { TermInsurance } from '@/models/TermInsurance';
import mongoose from 'mongoose';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// Function to ensure directory exists
async function ensureDirectoryExists(dirPath: string) {
  try {
    await mkdir(dirPath, { recursive: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
      throw error;
    }
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const formData = await request.formData();
    const leadId = params.id;

    // Validate lead ID
    if (!mongoose.Types.ObjectId.isValid(leadId)) {
      return NextResponse.json(
        { error: 'Invalid lead ID' },
        { status: 400 }
      );
    }

    // Handle file uploads
    const files = {
      panPhoto: formData.get('panPhoto') as File,
      aadharPhoto: formData.get('aadharPhoto') as File,
      userPhoto: formData.get('userPhoto') as File,
      cancelledCheque: formData.get('cancelledCheque') as File,
      bankStatement: formData.get('bankStatement') as File,
    };

    // Create base directory for uploads
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', leadId);
    await ensureDirectoryExists(uploadsDir);

    // Upload files locally and get URLs
    const fileUrls: Record<string, string> = {};
    for (const [key, file] of Object.entries(files)) {
      if (file) {
        const fileExtension = file.name.split('.').pop();
        const fileName = `${key}-${Date.now()}.${fileExtension}`;
        const filePath = path.join(uploadsDir, fileName);

        // Convert File to Buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Write file to disk
        await writeFile(filePath, buffer);

        // Store relative URL for database
        fileUrls[key] = `/uploads/${leadId}/${fileName}`;
      }
    }

    // Extract other form data
    const formDataObj: Record<string, any> = {};
    formData.forEach((value, key) => {
      if (!key.includes('Photo') && key !== 'cancelledCheque' && key !== 'bankStatement') {
        formDataObj[key] = value;
      }
    });

    // Create new term insurance record
    const termInsurance = new TermInsurance({
      leadId,
      ...formDataObj,
      ...fileUrls,
      status: 'Submitted'
    });

    await termInsurance.save();

    return NextResponse.json(termInsurance, { status: 201 });
  } catch (error: any) {
    console.error('Error creating term insurance:', error);
    if (error.name === 'ValidationError') {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create term insurance record' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const leadId = params.id;

    // Validate lead ID
    if (!mongoose.Types.ObjectId.isValid(leadId)) {
      return NextResponse.json(
        { error: 'Invalid lead ID' },
        { status: 400 }
      );
    }

    // Find term insurance record for the lead
    const termInsurance = await TermInsurance.findOne({ leadId });

    if (!termInsurance) {
      return NextResponse.json(
        { error: 'Term insurance record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(termInsurance);
  } catch (error) {
    console.error('Error fetching term insurance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch term insurance record' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const leadId = params.id;
    const body = await request.json();

    // Validate lead ID
    if (!mongoose.Types.ObjectId.isValid(leadId)) {
      return NextResponse.json(
        { error: 'Invalid lead ID' },
        { status: 400 }
      );
    }

    // Find and update term insurance record
    const termInsurance = await TermInsurance.findOneAndUpdate(
      { leadId },
      { status: body.status },
      { new: true }
    );

    if (!termInsurance) {
      return NextResponse.json(
        { error: 'Term insurance record not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(termInsurance);
  } catch (error) {
    console.error('Error updating term insurance:', error);
    return NextResponse.json(
      { error: 'Failed to update term insurance record' },
      { status: 500 }
    );
  }
} 