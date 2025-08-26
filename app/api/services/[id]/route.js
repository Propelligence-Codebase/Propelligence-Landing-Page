import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { processDataForStorage, processDataAfterRetrieval } from '@/lib/dataProcessor';

// GET: Get a single service by ID
export async function GET(req, context) {
  try {
    const params = await context.params;
    const client = await clientPromise;
    const db = client.db();
    const { id } = params;
    const storedService = await db.collection('services').findOne({ _id: new ObjectId(id) });
    
    if (!storedService) {
      return new Response(JSON.stringify({ error: 'Service not found' }), { status: 404 });
    }
    
    // Decompress and verify the service data
    const service = await processDataAfterRetrieval(storedService);
    
    return new Response(JSON.stringify(service), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching service:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch service' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// PUT: Update a service
export async function PUT(req, context) {
  try {
    const params = await context.params;
    const { id } = params;
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

    // Get the current service to check if slug is changing
    const currentService = await db.collection('services').findOne({ _id: new ObjectId(id) });
    if (!currentService) {
      return new Response(JSON.stringify({ error: 'Service not found' }), { status: 404 });
    }
    
    // Check if slug already exists (excluding current service)
    if (body.slug) {
      const existingService = await db.collection('services').findOne({ 
        slug: body.slug, 
        _id: { $ne: new ObjectId(id) } 
      });
      if (existingService) {
        return new Response(JSON.stringify({ error: 'A service with this title already exists' }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
    
    // Check if slug is changing
    const slugChanged = currentService.slug !== body.slug;
    const oldSlug = currentService.slug;
    
    // Prepare service data (without slug for compression)
    const serviceDataForCompression = {
      title: body.title,
      shortDescription: body.shortDescription,
      keywords: body.keywords || [],
      blocks: body.blocks,
      updatedAt: new Date(),
    };
    
    // Compress and hash the data before storing
    const processedData = await processDataForStorage(serviceDataForCompression);
    
    // Store with slug at top level for easy querying
    const dataToUpdate = {
      ...processedData,
      slug: body.slug,
    };
    
    const result = await db.collection('services').updateOne(
      { _id: new ObjectId(id) },
      { $set: dataToUpdate }
    );
    
    if (result.matchedCount === 0) {
      return new Response(JSON.stringify({ error: 'Service not found' }), { status: 404 });
    }
    
    return new Response(JSON.stringify({ 
      message: 'Service updated successfully',
      slug: body.slug,
      slugChanged: slugChanged,
      oldSlug: oldSlug,
      compressionInfo: {
        originalSize: processedData.metadata.originalSize,
        compressedSize: processedData.metadata.compressedSize,
        compressionRatio: processedData.metadata.compressionRatio
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error updating service:', error);
    return new Response(JSON.stringify({ error: 'Failed to update service' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// DELETE: Delete a service
export async function DELETE(req, context) {
  try {
    const params = await context.params;
    const { id } = params;
    
    const client = await clientPromise;
    const db = client.db();
    
    const result = await db.collection('services').deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return new Response(JSON.stringify({ error: 'Service not found' }), { status: 404 });
    }
    
    return new Response(JSON.stringify({ 
      message: 'Service deleted successfully',
      deletedCount: result.deletedCount
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error deleting service:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete service' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
