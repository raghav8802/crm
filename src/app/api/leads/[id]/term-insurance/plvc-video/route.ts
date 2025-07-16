import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import TermInsuranceVerification, { VerificationDocumentGroup } from '@/models/TermInsuranceVerification';
import { uploadFileToS3 } from '@/utils/s3Upload';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect();

  try {
    const leadId = params.id;
    const formData = await req.formData();
    const files = formData.getAll('media') as File[];
    const type = formData.get('type') as 'plvc' | 'welcome' | 'sales';

    if (!files || files.length === 0) {
      return NextResponse.json({ success: false, message: 'No files provided' }, { status: 400 });
    }
    if (!type) {
      return NextResponse.json({ success: false, message: 'Upload type not specified' }, { status: 400 });
    }

    const verification = await TermInsuranceVerification.findOne({ leadId });
    if (!verification) {
      return NextResponse.json({ success: false, message: 'Verification details not found' }, { status: 404 });
    }

    let documentType: string;
    switch (type) {
      case 'plvc':
        documentType = 'Verification Call';
        break;
      case 'welcome':
        documentType = 'Welcome Call';
        break;
      case 'sales':
        documentType = 'Sales Audio';
        break;
      default:
        return NextResponse.json({ success: false, message: 'Invalid upload type' }, { status: 400 });
    }

    const uploadedFiles = await Promise.all(
      files.map(async (file) => {
        const fileType = file.type.startsWith('video/') ? 'video' : 'audio';
        const { url } = await uploadFileToS3(file, leadId, 'verification');
        return {
          url,
          fileName: file.name,
          fileType,
        };
      })
    );

    const docGroup = verification.verificationDocuments.find(
      (doc: VerificationDocumentGroup) => doc.documentType === documentType
    );

    if (docGroup) {
      docGroup.files.push(...uploadedFiles);
    } else {
      verification.verificationDocuments.push({
        documentType,
        files: uploadedFiles,
      });
    }

    verification.markModified('verificationDocuments');
    await verification.save();

    return NextResponse.json({ success: true, data: verification });
  } catch (error) {
    console.error('Error in PLVC video upload:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ success: false, message: 'Server error', error: errorMessage }, { status: 500 });
  }
} 