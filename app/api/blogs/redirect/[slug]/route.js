import clientPromise from '@/lib/mongodb';
import { processDataAfterRetrieval } from '@/lib/dataProcessor';

// GET: Handle slug redirects for blogs
export async function GET(req, context) {
  try {
    const params = await context.params;
    const { slug } = params;
    
    console.log('Checking for blog redirect with slug:', slug);
    
    const client = await clientPromise;
    const db = client.db();
    
    // First, try to find the blog directly by slug
    const storedBlog = await db.collection('blogs').findOne({ slug: slug });
    
    if (storedBlog) {
      console.log('Blog found directly, no redirect needed');
      return new Response(JSON.stringify({ 
        found: true, 
        slug: slug,
        redirect: false 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // If not found, check if it might be an old slug
    console.log('Blog not found, checking for potential slug changes...');
    
    const allBlogs = await db.collection('blogs').find({}).toArray();
    let foundBlog = null;
    
    for (const blog of allBlogs) {
      try {
        const processedBlog = await processDataAfterRetrieval(blog);
        
        // Check if the title (when converted to slug format) matches the requested slug
        const titleSlug = processedBlog.title
          ?.toLowerCase()
          ?.replace(/[^a-z0-9\s-]/g, '')
          ?.replace(/\s+/g, '-')
          ?.replace(/-+/g, '-')
          ?.trim();
          
        if (titleSlug === slug) {
          foundBlog = blog;
          break;
        }
        
        // Also check if the slug contains the title (for partial matches)
        if (processedBlog.title && 
            slug.includes(processedBlog.title.toLowerCase().replace(/[^a-z0-9]/g, ''))) {
          foundBlog = blog;
          break;
        }
      } catch (error) {
        console.log('Error processing blog for slug check:', error);
        continue;
      }
    }
    
    if (foundBlog) {
      console.log('Found blog with different slug, providing redirect info');
      return new Response(JSON.stringify({ 
        found: true, 
        slug: foundBlog.slug,
        redirect: true,
        oldSlug: slug,
        newSlug: foundBlog.slug
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    console.log('No matching blog found');
    return new Response(JSON.stringify({ 
      found: false, 
      slug: slug,
      redirect: false 
    }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Error checking blog redirect:', error);
    return new Response(JSON.stringify({ error: 'Failed to check blog redirect' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 