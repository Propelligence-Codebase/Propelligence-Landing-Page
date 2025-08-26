import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '../../../../../lib/mongodb';
import { processDataAfterRetrieval } from '@/lib/dataProcessor';

// POST: Add a note to a contact submission
export async function POST(req, { params }) {
  try {
    const { id } = await params;
    const { content } = await req.json();
    
    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Note content is required' }, { status: 400 });
    }

    if (!id) {
      return NextResponse.json({ error: 'Submission ID is required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    
    const note = {
      _id: new ObjectId(),
      content: content.trim(),
      createdAt: new Date(),
      createdBy: 'admin' // You can enhance this with actual user info later
    };

    // First, get the existing document to update it properly
    const existingDoc = await db.collection('contact_submissions').findOne({ _id: new ObjectId(id) });
    if (!existingDoc) {
      return NextResponse.json({ error: 'Contact submission not found' }, { status: 404 });
    }

    // Decompress the existing data
    const decompressedData = await processDataAfterRetrieval(existingDoc);
    
    // Add the new note to the decompressed data
    const updatedData = {
      ...decompressedData,
      notes: [...(decompressedData.notes || []), note],
      updatedAt: new Date()
    };

    // Re-compress the updated data
    const { processDataForStorage } = await import('@/lib/dataProcessor');
    const processedData = await processDataForStorage(updatedData);

    const result = await db.collection('contact_submissions').updateOne(
      { _id: new ObjectId(id) },
      { $set: processedData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Contact submission not found' }, { status: 404 });
    }

    // Return the updated contact submission with processed data
    const rawSubmission = await db.collection('contact_submissions').findOne(
      { _id: new ObjectId(id) }
    );

    if (!rawSubmission) {
      return NextResponse.json({ error: 'Failed to retrieve updated submission' }, { status: 500 });
    }

    // Process the data the same way as the main API
    const updatedSubmission = await processDataAfterRetrieval(rawSubmission);

    console.log('Note added successfully to submission:', id);
    console.log('Updated submission notes:', updatedSubmission.notes);
    return NextResponse.json(updatedSubmission);
  } catch (error) {
    console.error('Error adding note:', error);
    return NextResponse.json({ error: 'Failed to add note' }, { status: 500 });
  }
} 