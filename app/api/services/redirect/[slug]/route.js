import clientPromise from '@/lib/mongodb';
import { processDataAfterRetrieval } from '@/lib/dataProcessor';

// GET: Handle slug redirects for services
export async function GET(req, context) {
  try {
    const params = await context.params;
    const { slug } = params;
    
    console.log('Checking for service redirect with slug:', slug);
    
    const client = await clientPromise;
    const db = client.db();
    
    // First, try to find the service directly by slug
    const storedService = await db.collection('services').findOne({ slug: slug });
    
    if (storedService) {
      console.log('Service found directly, no redirect needed');
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
    console.log('Service not found, checking for potential slug changes...');
    
    const allServices = await db.collection('services').find({}).toArray();
    let foundService = null;
    
    for (const service of allServices) {
      try {
        const processedService = await processDataAfterRetrieval(service);
        
        // Check if the title (when converted to slug format) matches the requested slug
        const titleSlug = processedService.title
          ?.toLowerCase()
          ?.replace(/[^a-z0-9\s-]/g, '')
          ?.replace(/\s+/g, '-')
          ?.replace(/-+/g, '-')
          ?.trim();
          
        if (titleSlug === slug) {
          foundService = service;
          break;
        }
        
        // Also check if the slug contains the title (for partial matches)
        if (processedService.title && 
            slug.includes(processedService.title.toLowerCase().replace(/[^a-z0-9]/g, ''))) {
          foundService = service;
          break;
        }
      } catch (error) {
        console.log('Error processing service for slug check:', error);
        continue;
      }
    }
    
    if (foundService) {
      console.log('Found service with different slug, providing redirect info');
      return new Response(JSON.stringify({ 
        found: true, 
        slug: foundService.slug,
        redirect: true,
        oldSlug: slug,
        newSlug: foundService.slug
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    console.log('No matching service found');
    return new Response(JSON.stringify({ 
      found: false, 
      slug: slug,
      redirect: false 
    }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
    
  } catch (error) {
    console.error('Error checking service redirect:', error);
    return new Response(JSON.stringify({ error: 'Failed to check service redirect' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 