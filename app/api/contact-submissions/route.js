import clientPromise from '../../../lib/mongodb';
import { processMultipleAfterRetrieval } from '@/lib/dataProcessor';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    const storedSubmissions = await db
      .collection('contact_submissions')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    
    // Decompress and verify all submissions
    const submissions = await processMultipleAfterRetrieval(storedSubmissions);
    
    return new Response(JSON.stringify(submissions), { status: 200 });
  } catch (error) {
    console.error('Error fetching contact submissions:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch contact submissions' }), { status: 500 });
  }
} 