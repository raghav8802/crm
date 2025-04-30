import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Lead } from '@/models/Lead';
import mongoose from 'mongoose';
import { LeadThread } from '@/models/LeadThread';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const lead = await Lead.findById(params.id);
    
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Fetch thread entries for this lead
    const threadEntries = await LeadThread.find({ leadId: params.id }).sort({ timestamp: -1 });
    
    return NextResponse.json({
      ...lead.toObject(),
      thread: threadEntries
    });
  } catch (error) {
    console.error('Error fetching lead:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lead' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const lead = await Lead.findById(params.id);
    
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: 'Invalid lead ID format' },
        { status: 400 }
      );
    }

    // Delete all thread entries for this lead
    await LeadThread.deleteMany({ leadId: params.id });
    
    // Delete the lead
    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }
    
    return NextResponse.json({ message: 'Lead and associated threads deleted successfully' });
  } catch (error) {
    console.error('Error deleting lead:', error);
    return NextResponse.json(
      { error: 'Failed to delete lead' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const body = await request.json();
    
    if (!mongoose.Types.ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { error: 'Invalid lead ID format' },
        { status: 400 }
      );
    }

    // Get the current lead to compare changes
    const currentLead = await Lead.findById(params.id);
    if (!currentLead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Update the lead with new data
    const updatedLead = await Lead.findByIdAndUpdate(
      params.id,
      { ...body, updatedAt: new Date() },
      { new: true }
    );

    // Create thread entries for changes
    if (body.status && body.status !== currentLead.status) {
      const threadEntry = new LeadThread({
        leadId: params.id,
        action: 'Status Update',
        details: `Status changed from ${currentLead.status} to ${body.status}`,
        performedBy: 'System'
      });
      await threadEntry.save();
    }

    if (body.assignedTo && body.assignedTo !== currentLead.assignedTo) {
      const threadEntry = new LeadThread({
        leadId: params.id,
        action: 'Assignment Update',
        details: `Assigned to ${body.assignedTo}`,
        performedBy: 'System'
      });
      await threadEntry.save();
    }

    // Handle note addition
    if (body.newNote) {
      const threadEntry = new LeadThread({
        leadId: params.id,
        action: 'Note Added',
        details: body.newNote,
        performedBy: 'System'
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