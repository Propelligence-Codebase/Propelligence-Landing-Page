import clientPromise from '@/lib/mongodb';
import { processDataForStorage, processMultipleAfterRetrieval } from '@/lib/dataProcessor';

// GET: Fetch all blogs with optional sort and search
export async function GET(req) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const url = new URL(req.url);
    const sort = url.searchParams.get('sort') || 'newest';
    const search = url.searchParams.get('search') || '';
    
    const query = search
      ? {
          $or: [
            { 'compressedData': { $regex: search, $options: 'i' } },
            { 'hash': { $regex: search, $options: 'i' } },
          ],
        }
      : {};
    
    const sortObj = sort === 'oldest' ? { _id: 1 } : { _id: -1 };
    const storedBlogs = await db.collection('blogs').find(query).sort(sortObj).toArray();
    
    // Decompress and verify all blogs
    const blogs = await processMultipleAfterRetrieval(storedBlogs);
    
    return new Response(JSON.stringify(blogs), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching blogs:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch blogs' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// POST: Create a new blog
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
      const existingBlog = await db.collection('blogs').findOne({ slug: body.slug });
      if (existingBlog) {
        return new Response(JSON.stringify({ error: 'A blog with this title already exists' }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
    
    // Prepare blog data (without slug for compression)
    const blogDataForCompression = {
      title: body.title,
      shortDescription: body.shortDescription,
      keywords: body.keywords || [],
      blocks: body.blocks,
      editor: body.editor,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    // Compress and hash the data before storing
    const processedData = await processDataForStorage(blogDataForCompression);
    
    // Store with slug at top level for easy querying
    const dataToStore = {
      ...processedData,
      slug: body.slug,
    };
    
    const result = await db.collection('blogs').insertOne(dataToStore);
    
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
    console.error('Error creating blog:', error);
    return new Response(JSON.stringify({ error: 'Failed to create blog' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
