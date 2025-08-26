import clientPromise from '@/lib/mongodb';
import { processDataForStorage, processMultipleAfterRetrieval } from '@/lib/dataProcessor';

// GET: Fetch all services
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    const storedServices = await db.collection('services').find({}).toArray();
    
    // Decompress and verify all services
    const services = await processMultipleAfterRetrieval(storedServices);
    
    return new Response(JSON.stringify(services), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch services' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// POST: Create a new service
export async function POST(req) {
  try {
    const body = await req.json();
    const client = await clientPromise;
    const db = client.db();
    
    // Validate required fields
    if (!body.title || !body.shortDescription || !body.blocks || body.blocks.length === 0) {
      return new Response(JSON.stringify({ error: 'Title, short description, and at least one block are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Check if slug already exists
    if (body.slug) {
      const existingService = await db.collection('services').findOne({ slug: body.slug });
      if (existingService) {
        return new Response(JSON.stringify({ error: 'A service with this title already exists' }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
    
    // Prepare service data (without slug for compression)
    const serviceDataForCompression = {
      title: body.title,
      shortDescription: body.shortDescription,
      keywords: body.keywords || [],
      blocks: body.blocks,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Compress and hash the data before storing
    const processedData = await processDataForStorage(serviceDataForCompression);
    
    // Store with slug at top level for easy querying
    const dataToStore = {
      ...processedData,
      slug: body.slug,
    };
    
    console.log('Storing service with data structure:', Object.keys(dataToStore));
    console.log('Slug being stored:', body.slug);
    
    const result = await db.collection('services').insertOne(dataToStore);
    
    return new Response(JSON.stringify({ 
      insertedId: result.insertedId,
      slug: body.slug,
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
    console.error('Error creating service:', error);
    return new Response(JSON.stringify({ error: 'Failed to create service' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
