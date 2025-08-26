import clientPromise from '../../../../lib/mongodb';

export async function POST() {
  try {
    const client = await clientPromise;
    const db = client.db();
    
    const results = {
      services: {
        total: 0,
        valid: 0,
        invalid: 0,
        fixed: 0,
        errors: []
      }
    };

    // Check services collection
    const services = await db.collection('services').find({}).toArray();
    results.services.total = services.length;

    for (const service of services) {
      try {
        // Check if service has required fields
        if (!service.title || !service.shortDescription || !service.slug) {
          results.services.invalid++;
          results.services.errors.push({
            id: service._id.toString(),
            issue: 'Missing required fields',
            fields: {
              hasTitle: !!service.title,
              hasShortDescription: !!service.shortDescription,
              hasSlug: !!service.slug
            }
          });
          
          // Try to fix if possible
          if (!service.slug && service.title) {
            const { generateSlug } = await import('@/lib/utils');
            const newSlug = generateSlug(service.title);
            await db.collection('services').updateOne(
              { _id: service._id },
              { $set: { slug: newSlug } }
            );
            results.services.fixed++;
          }
        } else {
          results.services.valid++;
        }
      } catch (error) {
        results.services.errors.push({
          id: service._id.toString(),
          issue: 'Processing error',
          error: error.message
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      results,
      recommendations: [
        results.services.invalid > 0 ? 'Some services have missing required fields' : null,
        results.services.fixed > 0 ? `${results.services.fixed} services were automatically fixed` : null
      ].filter(Boolean)
    }, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in repair endpoint:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to repair database',
      details: error.message 
    }, null, 2), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 