import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Lead } from '@/models/Lead';
import mongoose from 'mongoose';
import { LeadThread } from '@/models/LeadThread';

type Props = {
  params: {
    id: string;
  };
};

export async function GET(request: Request, props: Props) {
  try {
    await connectDB();
    const id = props.params.id;
    
    const lead = await Lead.findById(id);
    
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Fetch thread entries for this lead
    const threadEntries = await LeadThread.find({ leadId: id }).sort({ timestamp: -1 });
    
    return NextResponse.json({
      ...lead.toObject(),
      thread: threadEntries
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, props: Props) {
  try {
    await connectDB();
    const id = props.params.id;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid lead ID format' },
        { status: 400 }
      );
    }

    const lead = await Lead.findById(id);
    
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Delete all thread entries for this lead
    await LeadThread.deleteMany({ leadId: id });
    
    // Delete the lead
    await Lead.findByIdAndDelete(id);
    
    return NextResponse.json({ message: 'Lead and associated threads deleted successfully' });
  } catch (error) {
    console.error('Error deleting lead:', error);
    return NextResponse.json(
      { error: 'Failed to delete lead' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, props: Props) {
  try {
    await connectDB();
    const id = props.params.id;
    const body = await request.json();
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'Invalid lead ID format' },
        { status: 400 }
      );
    }

    // Get the current lead to compare changes
    const currentLead = await Lead.findById(id);
    if (!currentLead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Update the lead with new data
    const updatedLead = await Lead.findByIdAndUpdate(
      id,
      { ...body, updatedAt: new Date() },
      { new: true }
    );

    // Use performedBy from request, fallback to 'System'
    const performedBy = body.performedBy || 'System';

    // Create thread entries for changes
    if (body.status && body.status !== currentLead.status) {
      const threadEntry = new LeadThread({
        leadId: id,
        action: 'Status Update',
        details: `Status changed from ${currentLead.status} to ${body.status}`,
        performedBy
      });
      await threadEntry.save();
    }

    if (body.assignedTo && body.assignedTo !== currentLead.assignedTo) {
      const threadEntry = new LeadThread({
        leadId: id,
        action: 'Assignment Update',
        details: `Assigned to ${body.assignedTo}`,
        performedBy
      });
      await threadEntry.save();
    }

    // Handle note addition
    if (body.newNote) {
      const threadEntry = new LeadThread({
        leadId: id,
        action: 'Note Added',
        details: body.newNote,
        performedBy
      });
      await threadEntry.save();
    }
    
    return NextResponse.json(updatedLead);
  } catch (error) {
    console.error('Error updating lead:', error);
    return NextResponse.json(
      { error: 'Failed to update lead' },
      { status: 500 }
    );
  }
} 