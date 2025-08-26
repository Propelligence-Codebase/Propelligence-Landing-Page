import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { processDataForStorage, processDataAfterRetrieval } from '@/lib/dataProcessor';

// GET: Get a single testimonial by ID
export async function GET(req, context) {
  try {
    const params = await context.params;
    const client = await clientPromise;
    const db = client.db();
    const { id } = params;
    const storedTestimonial = await db.collection('testimonials').findOne({ _id: new ObjectId(id) });
    
    if (!storedTestimonial) {
      return new Response(JSON.stringify({ error: 'Testimonial not found' }), { status: 404 });
    }
    
    // Decompress and verify the testimonial data
    const testimonial = await processDataAfterRetrieval(storedTestimonial);
    
    return new Response(JSON.stringify(testimonial), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching testimonial:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch testimonial' }), { status: 500 });
  }
}

// PUT: Update a testimonial by ID
export async function PUT(req, context) {
  try {
    const params = await context.params;
    const client = await clientPromise;
    const db = client.db();
    const { id } = params;
    const body = await req.json();
    
    // Compress and hash the updated data
    const processedData = await processDataForStorage(body);
    
    const result = await db.collection('testimonials').updateOne(
      { _id: new ObjectId(id) },
      { $set: processedData }
    );
    
    if (result.matchedCount === 0) {
      return new Response(JSON.stringify({ error: 'Testimonial not found' }), { status: 404 });
    }
    
    return new Response(JSON.stringify({ 
      updated: true,
      compressionInfo: {
        originalSize: processedData.metadata.originalSize,
        compressedSize: processedData.metadata.compressedSize,
        compressionRatio: processedData.metadata.compressionRatio
      }
    }), { status: 200 });
  } catch (error) {
    console.error('Error updating testimonial:', error);
    return new Response(JSON.stringify({ error: 'Failed to update testimonial' }), { status: 500 });
  }
}

// DELETE: Delete a testimonial by ID
export async function DELETE(req, context) {
  try {
    const params = await context.params;
    const client = await clientPromise;
    const db = client.db();
    const { id } = params;
    const result = await db.collection('testimonials').deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return new Response(JSON.stringify({ error: 'Testimonial not found' }), { status: 404 });
    }
    
    return new Response(JSON.stringify({ deleted: true }), { status: 200 });
  } catch (error) {
    console.error('Error deleting testimonial:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete testimonial' }), { status: 500 });
  }
}
