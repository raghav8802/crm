import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import HealthInsuranceVerification from '@/models/HealthInsuranceVerification';
import { uploadFileToS3 } from '@/utils/s3Upload';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const leadId = params.id;
    const formData = await req.formData();

    const verificationData: Record<string, any> = {
      leadId,
      status: 'submitted',
      insuranceType: 'health_insurance',
      documents: {
        proposerDocuments: [],
        insuredPersonsDocuments: []
      },
      paymentDocuments: [],
      verificationDocuments: []
    };

    // Process proposer documents
    const proposerDocumentTypes = ['PAN', 'Aadhaar', 'Photo', 'Cancelled Cheque', 'Bank Statement', 'Other'];
    for (const docType of proposerDocumentTypes) {
      const files = formData.getAll(`proposer_${docType.toLowerCase().replace(' ', '_')}`) as File[];
      if (files.length > 0) {
        const uploadedFiles = await Promise.all(
          files.map(async (file) => {
            const { url, originalFileName } = await uploadFileToS3(file, leadId, 'docs', 'health-insurance');
            return { url, fileName: originalFileName };
          })
        );
        verificationData.documents.proposerDocuments.push({
          documentType: docType,
          files: uploadedFiles
        });
      }
    }

    // Process insured persons data
    const insuredPersonsData = formData.get('insuredPersons');
    if (insuredPersonsData) {
      try {
        const insuredPersons = JSON.parse(insuredPersonsData as string);
        const processedInsuredPersons = await Promise.all(
          insuredPersons.map(async (person: any, index: number) => {
            const processedPerson = { ...person };
            
            // Handle aadhar documents for each insured person
            const aadharFiles = formData.getAll(`insuredPerson_${index}_aadhar`) as File[];
            if (aadharFiles.length > 0) {
              const uploadedAadharFiles = await Promise.all(
                aadharFiles.map(async (file) => {
                  const { url, originalFileName } = await uploadFileToS3(file, leadId, 'docs', 'health-insurance');
                  return { url, fileName: originalFileName };
                })
              );
              
              if (!verificationData.documents.insuredPersonsDocuments[index]) {
                verificationData.documents.insuredPersonsDocuments[index] = {
                  personIndex: index,
                  documents: []
                };
              }
              
              verificationData.documents.insuredPersonsDocuments[index].documents.push({
                documentType: 'Aadhaar',
                files: uploadedAadharFiles
              });
            }

            // Handle medical documents for each insured person
            const medicalFiles = formData.getAll(`insuredPerson_${index}_medical`) as File[];
            if (medicalFiles.length > 0) {
              const uploadedMedicalFiles = await Promise.all(
                medicalFiles.map(async (file) => {
                  const { url, originalFileName } = await uploadFileToS3(file, leadId, 'docs', 'health-insurance');
                  return { url, fileName: originalFileName };
                })
              );
              
              if (!verificationData.documents.insuredPersonsDocuments[index]) {
                verificationData.documents.insuredPersonsDocuments[index] = {
                  personIndex: index,
                  documents: []
                };
              }
              
              verificationData.documents.insuredPersonsDocuments[index].documents.push({
                documentType: 'Medical Documents',
                files: uploadedMedicalFiles
              });
            }

            return processedPerson;
          })
        );
        verificationData.insuredPersons = processedInsuredPersons;
      } catch (error) {
        console.error('Error processing insured persons data:', error);
      }
    }

    // Process other form fields
    for (const [key, value] of formData.entries()) {
      if (!key.startsWith('proposer_') && !key.startsWith('insuredPerson_') && key !== 'insuredPersons') {
        if (value !== null && value !== undefined && value !== '') {
          verificationData[key] = value;
        }
      }
    }

    // Set panNumber and aadharNumber for search/filter
    if (verificationData.proposerPanNumber) {
      verificationData.panNumber = verificationData.proposerPanNumber;
    }
    if (verificationData.insuredPersons && verificationData.insuredPersons.length > 0) {
      verificationData.aadharNumber = verificationData.insuredPersons[0].aadharNumber;
    }

    // Create verification record
    const verification = await HealthInsuranceVerification.create(verificationData);

    return NextResponse.json({ success: true, data: verification });
  } catch (error) {
    console.error('Error in health insurance verification:', error);
    return NextResponse.json(
      { error: 'Failed to process verification' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const leadId = params.id;

    const verification = await HealthInsuranceVerification.findOne({ leadId });
    if (!verification) {
      return NextResponse.json(
        { error: 'Verification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: verification });
  } catch (error) {
    console.error('Error fetching health insurance verification:', error);
    return NextResponse.json(
      { error: 'Failed to fetch verification' },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const leadId = params.id;
    const updateData = await req.json();
    let updateQuery: any = { $set: {} };

    if (updateData.newRemark) {
      updateQuery.$push = { remarks: updateData.newRemark };
      delete updateData.newRemark;
    }
    updateQuery.$set = { ...updateData };

    const verification = await HealthInsuranceVerification.findOneAndUpdate(
      { leadId },
      updateQuery,
      { new: true }
    );
    
    if (!verification) {
        return NextResponse.json(
        { error: 'Verification not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: verification });
  } catch (error) {
    console.error('Error updating health insurance verification:', error);
    return NextResponse.json(
      { error: 'Failed to update verification' },
      { status: 500 }
    );
  }
} 