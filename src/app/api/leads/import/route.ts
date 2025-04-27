import { NextResponse } from 'next/server';
import { Readable } from 'stream';
import * as XLSX from 'xlsx';
import connectDB from '@/lib/db';
import { Lead } from '@/models/Lead';

interface ExcelRow {
  [key: string]: string | undefined;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Parse Excel file
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json<ExcelRow>(worksheet);

    // Connect to database
    await connectDB();

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Process each row
    for (const row of data) {
      try {
        // Map Excel columns to Lead fields
        const leadData = {
          name: row['Name'] || row['name'],
          phoneNumber: row['Phone'] || row['phone'] || row['Phone Number'],
          email: row['Email'] || row['email'],
          status: row['Status'] || row['status'] || 'Fresh',
          assignedTo: row['Assigned To'] || row['assignedTo'] || row['Assigned'],
          notes: [],
          thread: [{
            action: 'Created',
            details: 'Imported from Excel',
            performedBy: 'System',
            timestamp: new Date()
          }]
        };

        // Validate required fields
        if (!leadData.name || !leadData.phoneNumber) {
          throw new Error(`Missing required fields for row: ${JSON.stringify(row)}`);
        }

        // Create new lead
        const lead = new Lead(leadData);
        await lead.save();
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push(error instanceof Error ? error.message : 'Unknown error');
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error importing leads:', error);
    return NextResponse.json(
      { error: 'Failed to import leads' },
      { status: 500 }
    );
  }
} 