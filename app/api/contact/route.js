import clientPromise from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';
import { processDataForStorage, processMultipleAfterRetrieval, processDataAfterRetrieval } from '@/lib/dataProcessor';

export async function POST(req) {
  try {
    const data = await req.json();
    const client = await clientPromise;
    const db = client.db();
    
    const submission = {
      ...data,
      createdAt: new Date(),
    };
    
    // Compress and hash the data before storing
    const processedData = await processDataForStorage(submission);
    
    await db.collection('contact_submissions').insertOne(processedData);
    
    return new Response(JSON.stringify({ 
      success: true,
      compressionInfo: {
        originalSize: processedData.metadata.originalSize,
        compressedSize: processedData.metadata.compressedSize,
        compressionRatio: processedData.metadata.compressionRatio
      }
    }), { status: 201 });
  } catch (error) {
    console.error('Error creating contact submission:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to create contact submission' }), { status: 500 });
  }
}

export async function GET(req) {
  const url = new URL(req.url);
  if (url.searchParams.get('all') !== '1') {
    return new Response(JSON.stringify({ error: 'Unauthorized or missing parameter.' }), { status: 400 });
  }
  try {
    const client = await clientPromise;
    const db = client.db();
    const storedSubmissions = await db.collection('contact_submissions').find({}).sort({ createdAt: -1 }).toArray();
    
    // Decompress and verify all submissions
    const submissions = await processMultipleAfterRetrieval(storedSubmissions);
    
    return new Response(JSON.stringify({ submissions }), { status: 200 });
  } catch (error) {
    console.error('Error fetching contact submissions:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch contact submissions' }), { status: 500 });
  }
}

export async function PATCH(req) {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing id parameter.' }), { status: 400 });
  }
  try {
    const data = await req.json();
    const client = await clientPromise;
    const db = client.db();
    
    // First, get the existing document to update it properly
    const existingDoc = await db.collection('contact_submissions').findOne({ _id: new ObjectId(id) });
    if (!existingDoc) {
      return new Response(JSON.stringify({ error: 'Not found.' }), { status: 404 });
    }
    
    // Decompress the existing data
    const decompressedData = await processDataAfterRetrieval(existingDoc);
    
    // Update the data
    const updatedData = {
      ...decompressedData,
      contacted: data.contacted,
      contactedAt: data.contacted ? new Date() : null
    };
    
    // Re-compress and hash the updated data
    const processedData = await processDataForStorage(updatedData);
    
    const result = await db.collection('contact_submissions').updateOne(
      { _id: new ObjectId(id) },
      { $set: processedData }
    );
    
    if (result.matchedCount === 1) {
      return new Response(JSON.stringify({ 
        success: true,
        compressionInfo: {
          originalSize: processedData.metadata.originalSize,
          compressedSize: processedData.metadata.compressedSize,
          compressionRatio: processedData.metadata.compressionRatio
        }
      }), { status: 200 });
    } else {
      return new Response(JSON.stringify({ error: 'Not found.' }), { status: 404 });
    }
  } catch (error) {
    console.error('Error updating contact submission:', error);
    return new Response(JSON.stringify({ error: 'Failed to update contact submission' }), { status: 500 });
  }
}

export async function DELETE(req) {
  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id) {
    return new Response(JSON.stringify({ error: 'Missing id parameter.' }), { status: 400 });
  }
  try {
    const client = await clientPromise;
    const db = client.db();
    const result = await db.collection('contact_submissions').deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 1) {
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    } else {
      return new Response(JSON.stringify({ error: 'Not found.' }), { status: 404 });
    }
  } catch (error) {
    console.error('Error deleting contact submission:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete contact submission' }), { status: 500 });
  }
} 