import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';
import { processDataForStorage, processDataAfterRetrieval } from '@/lib/dataProcessor';

// GET: Get a single blog by ID
export async function GET(req, context) {
  try {
    const params = await context.params;
    const client = await clientPromise;
    const db = client.db();
    const { id } = params;
    const storedBlog = await db.collection('blogs').findOne({ _id: new ObjectId(id) });
    
    if (!storedBlog) {
      return new Response(JSON.stringify({ error: 'Blog not found' }), { status: 404 });
    }
    
    // Decompress and verify the blog data
    const blog = await processDataAfterRetrieval(storedBlog);
    
    return new Response(JSON.stringify(blog), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching blog:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch blog' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// PUT: Update a blog
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

    // Get the current blog to check if slug is changing
    const currentBlog = await db.collection('blogs').findOne({ _id: new ObjectId(id) });
    if (!currentBlog) {
      return new Response(JSON.stringify({ error: 'Blog not found' }), { status: 404 });
    }
    
    // Check if slug already exists (excluding current blog)
    if (body.slug) {
      const existingBlog = await db.collection('blogs').findOne({ 
        slug: body.slug, 
        _id: { $ne: new ObjectId(id) } 
      });
      if (existingBlog) {
        return new Response(JSON.stringify({ error: 'A blog with this title already exists' }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
    
    // Check if slug is changing
    const slugChanged = currentBlog.slug !== body.slug;
    const oldSlug = currentBlog.slug;
    
    // Prepare blog data (without slug for compression)
    const blogDataForCompression = {
      title: body.title,
      shortDescription: body.shortDescription,
      keywords: body.keywords || [],
      blocks: body.blocks,
      editor: body.editor,
      updatedAt: new Date(),
    };
    
    // Compress and hash the data before storing
    const processedData = await processDataForStorage(blogDataForCompression);
    
    // Store with slug at top level for easy querying
    const dataToUpdate = {
      ...processedData,
      slug: body.slug,
    };
    
    const result = await db.collection('blogs').updateOne(
      { _id: new ObjectId(id) },
      { $set: dataToUpdate }
    );
    
    if (result.matchedCount === 0) {
      return new Response(JSON.stringify({ error: 'Blog not found' }), { status: 404 });
    }
    
    return new Response(JSON.stringify({ 
      message: 'Blog updated successfully',
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
    console.error('Error updating blog:', error);
    return new Response(JSON.stringify({ error: 'Failed to update blog' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

// DELETE: Delete a blog
export async function DELETE(req, context) {
  try {
    const params = await context.params;
    const { id } = params;
    
    const client = await clientPromise;
    const db = client.db();
    
    const result = await db.collection('blogs').deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return new Response(JSON.stringify({ error: 'Blog not found' }), { status: 404 });
    }
    
    return new Response(JSON.stringify({ 
      message: 'Blog deleted successfully',
      deletedCount: result.deletedCount
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error deleting blog:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete blog' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
