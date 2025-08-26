import clientPromise from '@/lib/mongodb';
import { processDataForStorage, processMultipleAfterRetrieval } from '@/lib/dataProcessor';

// GET: Fetch all testimonials
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    const storedTestimonials = await db.collection('testimonials').find({}).toArray();
    
    // Decompress and verify all testimonials
    const testimonials = await processMultipleAfterRetrieval(storedTestimonials);
    
    return new Response(JSON.stringify(testimonials), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch testimonials' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// POST: Create a new testimonial
export async function POST(req) {
  try {
    const body = await req.json();
    const client = await clientPromise;
    const db = client.db();
    
    // Compress and hash the data before storing
    const processedData = await processDataForStorage(body);
    
    const result = await db.collection('testimonials').insertOne(processedData);
    
    return new Response(JSON.stringify({ 
      insertedId: result.insertedId,
      compressionInfo: {
        originalSize: processedData.metadata.originalSize,
        compressedSize: processedData.metadata.compressedSize,
        compressionRatio: processedData.metadata.compressionRatio
      }
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating testimonial:', error);
    return new Response(JSON.stringify({ error: 'Failed to create testimonial' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
