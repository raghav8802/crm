import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import HealthInsuranceVerification from '@/models/HealthInsuranceVerification';
import { uploadFile } from '@/utils/fileUpload';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await connectDB();
    const leadId = params.id;
    const formData = await req.formData();

    // Handle file uploads for proposer
    const proposerFileFields = [
      'proposerPanImage',
      'proposerAadharPhoto',
      'proposerPhoto',
      'proposerCancelledCheque',
      'proposerBankStatement',
      'proposerOtherDocument'
    ];

    const verificationData: Record<string, any> = {
      leadId,
      status: 'submitted',
      insuranceType: 'health_insurance'
    };

    // Process proposer file uploads
    for (const field of proposerFileFields) {
      const file = formData.get(field) as File;
      if (file) {
        const filePath = await uploadFile(file, leadId, 'health-insurance');
        verificationData[field] = filePath;
      }
    }

    // Process insured persons data
    const insuredPersonsData = formData.get('insuredPersons');
    if (insuredPersonsData) {
      const insuredPersons = JSON.parse(insuredPersonsData as string);
      const processedInsuredPersons = await Promise.all(
        insuredPersons.map(async (person: any) => {
          const processedPerson = { ...person };
          
          // Handle aadhar photo upload
          const aadharPhotoFile = formData.get(`insuredPerson_${person.id}_aadharPhoto`) as File;
          if (aadharPhotoFile) {
            processedPerson.aadharPhoto = await uploadFile(aadharPhotoFile, leadId, 'health-insurance');
          }

          // Handle medical documents uploads
          const medicalDocs = [];
          let i = 0;
          while (true) {
            const file = formData.get(`insuredPerson_${person.id}_medicalDoc_${i}`) as File;
            if (!file) break;
            const filePath = await uploadFile(file, leadId, 'health-insurance');
            medicalDocs.push(filePath);
            i++;
          }
          if (medicalDocs.length > 0) {
            processedPerson.medicalDocuments = medicalDocs;
          }

          return processedPerson;
        })
      );
      verificationData.insuredPersons = processedInsuredPersons;
    }

    // Process other form fields
    for (const [key, value] of formData.entries()) {
      if (!proposerFileFields.includes(key) && key !== 'insuredPersons') {
        verificationData[key] = value;
      }
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
    
    // Check content type to determine if it's JSON or FormData
    const contentType = req.headers.get('content-type') || '';
    let updateData: Record<string, any> = {};

    if (contentType.includes('application/json')) {
      // Handle JSON data (status and remarks updates)
      const jsonData = await req.json();
      
      // Handle status update
      if (jsonData.status) {
        updateData.status = jsonData.status;
      }

      // Handle new remark
      if (jsonData.newRemark) {
        updateData = {
          ...updateData,
          $push: {
            remarks: {
              text: jsonData.newRemark.text,
              user: jsonData.newRemark.user,
              timestamp: new Date(jsonData.newRemark.timestamp)
            }
          }
        };
      }

      // Handle other field updates
      const allowedFields = [
        'selectedCompany',
        'manufacturerName',
        'planName',
        'premium',
        'ptPpt',
        'mode',
        'portFresh',
        'sumInsured',
        'sumInsuredType',
        'rider',
        'proposerName',
        'proposerMobile',
        'proposerEmail',
        'proposerAddress',
        'proposerAnnualIncome',
        'proposerPanNumber',
        'proposerHeight',
        'proposerWeight',
        'nomineeName',
        'nomineeRelation',
        'nomineeDOB'
      ];

      allowedFields.forEach(field => {
        if (jsonData[field] !== undefined) {
          updateData[field] = jsonData[field];
        }
      });

      // Handle insured persons updates
      if (jsonData.insuredPersons) {
        updateData.insuredPersons = jsonData.insuredPersons;
      }

    } else {
      // Handle FormData (file uploads)
      const formData = await req.formData();

      // Handle file uploads for proposer
      const proposerFileFields = [
        'proposerPanImage',
        'proposerAadharPhoto',
        'proposerPhoto',
        'proposerCancelledCheque',
        'proposerBankStatement',
        'proposerOtherDocument'
      ];

      // Process proposer file uploads
      for (const field of proposerFileFields) {
        const file = formData.get(field) as File;
        if (file) {
          const filePath = await uploadFile(file, leadId, 'health-insurance');
          updateData[field] = filePath;
        }
      }

      // Process insured persons data
      const insuredPersonsData = formData.get('insuredPersons');
      if (insuredPersonsData) {
        const insuredPersons = JSON.parse(insuredPersonsData as string);
        const processedInsuredPersons = await Promise.all(
          insuredPersons.map(async (person: any) => {
            const processedPerson = { ...person };
            
            // Handle aadhar photo upload
            const aadharPhotoFile = formData.get(`insuredPerson_${person.id}_aadharPhoto`) as File;
            if (aadharPhotoFile) {
              processedPerson.aadharPhoto = await uploadFile(aadharPhotoFile, leadId, 'health-insurance');
            }

            // Handle medical documents uploads
            const medicalDocs = [];
            let i = 0;
            while (true) {
              const file = formData.get(`insuredPerson_${person.id}_medicalDoc_${i}`) as File;
              if (!file) break;
              const filePath = await uploadFile(file, leadId, 'health-insurance');
              medicalDocs.push(filePath);
              i++;
            }
            if (medicalDocs.length > 0) {
              processedPerson.medicalDocuments = medicalDocs;
            }

            return processedPerson;
          })
        );
        updateData.insuredPersons = processedInsuredPersons;
      }

      // Process other form fields
      for (const [key, value] of formData.entries()) {
        if (!proposerFileFields.includes(key) && key !== 'insuredPersons') {
          updateData[key] = value;
        }
      }
    }

    // Update the verification record
    const verification = await HealthInsuranceVerification.findOneAndUpdate(
      { leadId },
      updateData,
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