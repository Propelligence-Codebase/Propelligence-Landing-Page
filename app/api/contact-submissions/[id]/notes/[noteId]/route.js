import { NextResponse } from 'next/server';
import { ObjectId } from 'mongodb';
import clientPromise from '../../../../../../lib/mongodb';
import { processDataAfterRetrieval } from '@/lib/dataProcessor';

// PATCH: Update a note in a contact submission
export async function PATCH(req, { params }) {
  try {
    const { id, noteId } = await params;
    const { content } = await req.json();
    
    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Note content is required' }, { status: 400 });
    }

    if (!id || !noteId) {
      return NextResponse.json({ error: 'Submission ID and Note ID are required' }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db();
    
    // First, get the existing document to update it properly
    const existingDoc = await db.collection('contact_submissions').findOne({ _id: new ObjectId(id) });
    if (!existingDoc) {
      return NextResponse.json({ error: 'Contact submission not found' }, { status: 404 });
    }

    // Decompress the existing data
    const decompressedData = await processDataAfterRetrieval(existingDoc);
    
    // Update the specific note in the decompressed data
    const updatedNotes = decompressedData.notes?.map(note => 
      note._id === noteId 
        ? { ...note, content: content.trim(), updatedAt: new Date() }
        : note
    ) || [];

    const updatedData = {
      ...decompressedData,
      notes: updatedNotes,
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
      return NextResponse.json({ error: 'Contact submission or note not found' }, { status: 404 });
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

    console.log('Note updated successfully in submission:', id);
    console.log('Updated submission notes:', updatedSubmission.notes);
    return NextResponse.json(updatedSubmission);
  } catch (error) {
    console.error('Error updating note:', error);
    return NextResponse.json({ error: 'Failed to update note' }, { status: 500 });
  }
}

// DELETE: Delete a note from a contact submission
export async function DELETE(req, { params }) {
  try {
    const { id, noteId } = await params;
    
    const client = await clientPromise;
    const db = client.db();
    
    // First, get the existing document to update it properly
    const existingDoc = await db.collection('contact_submissions').findOne({ _id: new ObjectId(id) });
    if (!existingDoc) {
      return NextResponse.json({ error: 'Contact submission not found' }, { status: 404 });
    }

    // Decompress the existing data
    const decompressedData = await processDataAfterRetrieval(existingDoc);
    
    // Remove the specific note from the decompressed data
    const updatedNotes = decompressedData.notes?.filter(note => note._id !== noteId) || [];

    const updatedData = {
      ...decompressedData,
      notes: updatedNotes,
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

    console.log('Note deleted successfully from submission:', id);
    return NextResponse.json(updatedSubmission);
  } catch (error) {
    console.error('Error deleting note:', error);
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
  }
} 