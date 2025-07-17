import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import  TermInsuranceVerification  from '@/models/TermInsuranceVerification';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const application = await (TermInsuranceVerification as any).findById(id)
      .populate('leadId', 'name phoneNumber email');

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(application);
  } catch (error) {
    console.error('Error fetching term insurance application:', error);
    return NextResponse.json(
      { error: 'Failed to fetch term insurance application' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const formData = await request.formData();
    const { id } = await params;

    // Create base directory structure
    const baseDir = path.join(process.cwd(), 'public', 'uploads', 'term-insurance');
    const leadDir = path.join(baseDir, id);
    const docsDir = path.join(leadDir, 'documents');
    
    // Create directories
    await mkdir(baseDir, { recursive: true });
    await mkdir(leadDir, { recursive: true });
    await mkdir(docsDir, { recursive: true });

    const processedData: Record<string, string> = {};
    
    // Process regular form fields
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        // Handle file uploads
        const fileName = `${key}_${Date.now()}${path.extname(value.name)}`;
        const filePath = path.join(docsDir, fileName);
        await writeFile(filePath, Buffer.from(await value.arrayBuffer()));
        processedData[key] = `/uploads/term-insurance/${id}/documents/${fileName}`;
      } else {
        processedData[key] = value as string;
      }
    }

    // Handle status update
    const { status } = processedData;
    const validStatuses = ['pending', 'approved', 'rejected', 'processing', 'link_sent', 'payment_done', 'sale_done'];

    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }

      await connectDB();
      const application = await (TermInsuranceVerification as any).findByIdAndUpdate(
      id,
      { 
        ...processedData,
        status 
      },
      { new: true }
    ).populate('leadId', 'name phoneNumber email');

    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(application);
  } catch (error) {
    console.error('Error updating term insurance application:', error);
    return NextResponse.json(
      { error: 'Failed to update term insurance application' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const formData = await request.formData();
    const { id } = await params;

    // Create base directory structure
    const baseDir = path.join(process.cwd(), 'public', 'uploads', 'term-insurance');
    const leadDir = path.join(baseDir, id);
    const docsDir = path.join(leadDir, 'documents');
    
    // Create directories
    await mkdir(baseDir, { recursive: true });
    await mkdir(leadDir, { recursive: true });
    await mkdir(docsDir, { recursive: true });

    const processedData: Record<string, string> = {};
    
    // Process regular form fields
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        // Handle file uploads
        const fileName = `${key}_${Date.now()}${path.extname(value.name)}`;
        const filePath = path.join(docsDir, fileName);
        await writeFile(filePath, Buffer.from(await value.arrayBuffer()));
        processedData[key] = `/uploads/term-insurance/${id}/documents/${fileName}`;
      } else {
        processedData[key] = value as string;
      }
    }

    // Create term insurance document with leadId and insuranceType
    const termInsurance = new TermInsuranceVerification({
      ...processedData,
      leadId: id,
      insuranceType: 'Term Insurance',
      status: 'pending'
    });

    await termInsurance.save();

    return NextResponse.json({
      message: 'Term insurance data saved successfully',
      data: termInsurance
    });

  } catch (error) {
    console.error('Error saving term insurance data:', error);
    return NextResponse.json(
      { error: 'Failed to save term insurance data' },
      { status: 500 }
    );
  }
} 