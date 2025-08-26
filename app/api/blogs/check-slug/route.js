import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get('slug');
    const excludeId = searchParams.get('excludeId');

    if (!slug) {
      return new Response(JSON.stringify({ error: 'Slug parameter is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const client = await clientPromise;
    const db = client.db();

    // Build query to check for existing slug
    const query = { slug: slug };
    if (excludeId) {
      query._id = { $ne: new ObjectId(excludeId) };
    }

    const existingBlog = await db.collection('blogs').findOne(query);

    return new Response(JSON.stringify({ 
      isUnique: !existingBlog,
      slug: slug
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error checking slug:', error);
    return new Response(JSON.stringify({ error: 'Failed to check slug' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 