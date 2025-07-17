import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import LifeInsuranceVerification from '@/models/LifeInsuranceVerification';
import { uploadFileToS3 } from '@/utils/s3Upload';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const formData = await request.formData();
    
    const file = formData.get('media') as File;
    const type = formData.get('type') as 'plvc' | 'welcome' | 'sales';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Check file type - allow video and audio files
    const isVideo = file.type.startsWith('video/');
    const isAudio = file.type.startsWith('audio/');
    
    if (!isVideo && !isAudio) {
      return NextResponse.json(
        { error: 'Please upload only MP4, MOV video files or MP3, WAV audio files' },
        { status: 400 }
      );
    }

    // Check file size (100MB limit for video/audio files)
    if (file.size > 100 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size should be less than 100MB' },
        { status: 400 }
      );
    }

    // Find the verification record
    const verification = await (LifeInsuranceVerification as any).findOne({ leadId: id });
    if (!verification) {
      return NextResponse.json(
        { error: 'Verification not found' },
        { status: 404 }
      );
    }

    // Upload file to S3
    const category = 'verification';
    const { url, originalFileName } = await uploadFileToS3(file, id, category, 'life-insurance');

    // Initialize verificationDocuments array if it doesn't exist
    if (!verification.verificationDocuments) {
      verification.verificationDocuments = [];
    }

    // Map type to document type
    const documentTypeMap = {
      'plvc': 'Verification Call',
      'welcome': 'Welcome Call',
      'sales': 'Sales Audio'
    };

    const documentType = documentTypeMap[type];
    const fileType = isVideo ? 'video' : 'audio';

    // Find existing document group
    const documentGroup = verification.verificationDocuments.find((doc: Record<string, unknown>) => doc.documentType === documentType);

    if (documentGroup) {
      // If group exists, add the new file to its files array
      documentGroup.files.push({
        fileType: fileType,
        url: url,
        fileName: originalFileName,
      });
    } else {
      // If group doesn't exist, create and push it with the file
      verification.verificationDocuments.push({
        documentType: documentType,
        files: [{
          fileType: fileType,
          url: url,
          fileName: originalFileName,
        }]
      });
    }

    // Mark as modified to ensure save
    verification.markModified('verificationDocuments');

    // Save the updated verification
    await verification.save();

    return NextResponse.json({
      success: true,
      data: verification
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
} 