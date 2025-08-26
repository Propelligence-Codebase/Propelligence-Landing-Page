import clientPromise from '../../../../lib/mongodb';
import { processMultipleAfterRetrieval } from '@/lib/dataProcessor';

export async function GET(req) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const url = new URL(req.url);
    const sort = url.searchParams.get('sort') || 'newest';
    const search = url.searchParams.get('search') || '';
    
    // Build query for search - search in compressed data or hash
    const query = search
      ? {
          $or: [
            { 'compressedData': { $regex: search, $options: 'i' } },
            { 'hash': { $regex: search, $options: 'i' } },
          ],
        }
      : {};
    
    // Build sort object
    const sortObj = sort === 'oldest' ? { _id: 1 } : { _id: -1 };
    
    // Get blogs with search and sorting
    const storedBlogs = await db.collection('blogs')
      .find(query)
      .sort(sortObj)
      .toArray();
    
    // Decompress and verify all blogs
    const blogs = await processMultipleAfterRetrieval(storedBlogs);
    
    return new Response(JSON.stringify(blogs), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching public blogs:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch blogs' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 