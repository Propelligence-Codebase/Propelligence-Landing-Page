import clientPromise from '../../../../lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    
    // Get all services with detailed info for debugging
    const services = await db.collection('services')
      .find({}, { 
        projection: { 
          _id: 1, 
          title: 1, 
          slug: 1, 
          createdAt: 1,
          updatedAt: 1,
          compressedData: 1,
          hash: 1
        } 
      })
      .sort({ createdAt: -1 })
      .toArray();
    
    // Get collection stats
    const stats = await db.collection('services').stats();
    
    // Check for the specific problematic slug
    const problematicSlug = 'full-stack-web-app-development-react-nextjs-mongodb-1752913221213';
    const exactMatch = await db.collection('services').findOne({ slug: problematicSlug });
    
    // Check for partial matches
    const partialMatches = await db.collection('services')
      .find({ 
        slug: { 
          $regex: 'full-stack-web-app-development-react-nextjs-mongodb', 
          $options: 'i' 
        } 
      })
      .toArray();
    
    return new Response(JSON.stringify({
      summary: {
        totalServices: services.length,
        collectionSize: stats.size,
        collectionCount: stats.count,
        problematicSlugExists: !!exactMatch,
        partialMatchesFound: partialMatches.length
      },
      problematicSlug: {
        searched: problematicSlug,
        exactMatch: exactMatch ? {
          id: exactMatch._id.toString(),
          title: exactMatch.title,
          slug: exactMatch.slug
        } : null,
        partialMatches: partialMatches.map(s => ({
          id: s._id.toString(),
          title: s.title,
          slug: s.slug,
          createdAt: s.createdAt
        }))
      },
      allServices: services.map(s => ({
        id: s._id.toString(),
        title: s.title,
        slug: s.slug,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
        hasCompressedData: !!s.compressedData,
        hasHash: !!s.hash
      }))
    }, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in debug services endpoint:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch services',
      details: error.message 
    }, null, 2), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 