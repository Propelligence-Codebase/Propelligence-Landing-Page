import clientPromise from '../../../../lib/mongodb';
import { processMultipleAfterRetrieval } from '@/lib/dataProcessor';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    
    // Get all services, sorted by creation date (newest first)
    const storedServices = await db.collection('services')
      .find({})
      .sort({ _id: -1 }) // Sort by ObjectId (newest first)
      .toArray();
    
    // Decompress and verify all services
    const services = await processMultipleAfterRetrieval(storedServices);
    
    return new Response(JSON.stringify(services), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching public services:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch services' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 