import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { VerificationDocument } from '@/models/VerificationDocument';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
});

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const document = await VerificationDocument.findOne({ leadId: params.id });
    return NextResponse.json(document || {});
  } catch (error) {
    console.error('Error fetching verification documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch verification documents' },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const formData = await req.formData();
    const documentType = formData.get('documentType') as string;
    const file = formData.get('file') as File;

    if (!file || !documentType) {
      return NextResponse.json(
        { error: 'File and document type are required' },
        { status: 400 }
      );
    }

    // Generate a unique filename
    const fileExtension = file.name.split('.').pop();
    const fileName = `${params.id}/${documentType}-${Date.now()}.${fileExtension}`;

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: fileName,
      ContentType: file.type,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    
    // Upload the file using the signed URL
    await fetch(signedUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    const fileUrl = `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;

    // Save to database
    await connectDB();
    let document = await VerificationDocument.findOne({ leadId: params.id });

    if (!document) {
      document = new VerificationDocument({ leadId: params.id });
    }

    document[documentType as keyof typeof document] = fileUrl;
    await document.save();

    return NextResponse.json(document);
  } catch (error) {
    console.error('Error uploading verification document:', error);
    return NextResponse.json(
      { error: 'Failed to upload verification document' },
      { status: 500 }
    );
  }
} 