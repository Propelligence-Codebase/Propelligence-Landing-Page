import BlogRenderer, { BlogBlock } from '@/app/components/BlogRenderer';
import ServiceRedirectHandler from '@/app/components/ServiceRedirectHandler';
import clientPromise from '@/lib/mongodb';
import { processDataAfterRetrieval } from '@/lib/dataProcessor';

interface ServicePageProps {
  params: Promise<{
    slug: string;
  }>;
}

interface ServiceData {
  title: string;
  shortDescription: string;
  keywords?: string[];
  blocks?: BlogBlock[];
  editor?: {
    name?: string;
    date?: string | Date;
  };
  [key: string]: unknown;
}

export default async function ServicePage({ params }: ServicePageProps) {
  try {
    const { slug } = await params;
    console.log('Fetching service with slug:', slug);
    
    const client = await clientPromise;
    const db = client.db();
    
    // Find service by slug (stored at top level)
    const storedService = await db.collection('services').findOne({ slug });
    
    console.log('Stored service found:', !!storedService);
    
    // If service not found by slug, show redirect handler (no fallback by title)
    if (!storedService) {
      console.log('Service not found by slug, showing redirect handler');
      return <ServiceRedirectHandler slug={slug} />;
    }
    
    // Decompress and verify the service data
    console.log('Processing service data...');
    let service: ServiceData;
    try {
      service = await processDataAfterRetrieval(storedService) as unknown as ServiceData;
      console.log('Service processed successfully');
    } catch (processError) {
      console.error('Error processing service data:', processError);
      // If processing fails, try to use the raw data with proper validation
      console.log('Attempting to use raw service data...');
      
      // Validate that storedService has the required structure before casting
      if (storedService && typeof storedService === 'object' && 'title' in storedService) {
        // Cast to unknown first, then to ServiceData for safer type conversion
        service = storedService as unknown as ServiceData;
      } else {
        console.error('Raw service data is invalid, showing redirect handler');
        return <ServiceRedirectHandler slug={slug} />;
      }
    }
    
    // Validate service data
    if (!service.title || !service.shortDescription) {
      console.error('Service missing required fields:', {
        hasTitle: !!service.title,
        hasShortDescription: !!service.shortDescription,
        serviceKeys: Object.keys(service)
      });
      return <ServiceRedirectHandler slug={slug} />;
    }
    
    return (
      <BlogRenderer
        title={service.title}
        shortDescription={service.shortDescription}
        keywords={service.keywords || []}
        blocks={service.blocks || []}
        type="service"
        slug={slug}
      />
    );
  } catch (error) {
    console.error('Error fetching service:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    const { slug } = await params;
    return <ServiceRedirectHandler slug={slug} />;
  }
}

// Generate metadata for the page
export async function generateMetadata({ params }: ServicePageProps) {
  try {
    const { slug } = await params;
    const client = await clientPromise;
    const db = client.db();
    
    const storedService = await db.collection('services').findOne({ slug });
    
    if (!storedService) {
      return {
        title: 'Service Not Found',
        description: 'The requested service could not be found.',
      };
    }
    
    const service = await processDataAfterRetrieval(storedService) as unknown as ServiceData;
    
    return {
      title: service.title,
      description: service.shortDescription,
      keywords: service.keywords?.join(', '),
      openGraph: {
        title: service.title,
        description: service.shortDescription,
        type: 'website',
        authors: service.editor?.name ? [service.editor.name] : undefined,
        publishedTime: service.editor?.date ? (typeof service.editor.date === 'string' ? service.editor.date : service.editor.date.toISOString()) : undefined,
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Service',
      description: 'Service page',
    };
  }
} 