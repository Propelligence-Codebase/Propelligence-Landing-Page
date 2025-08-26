import BlogRenderer, { BlogBlock } from '@/app/components/BlogRenderer';
import BlogRedirectHandler from '@/app/components/BlogRedirectHandler';
import clientPromise from '@/lib/mongodb';
import { processDataAfterRetrieval } from '@/lib/dataProcessor';

interface BlogPageProps {
  params: Promise<{
    slug: string;
  }>;
}

interface BlogData {
  title: string;
  shortDescription?: string;
  keywords?: string[];
  blocks?: BlogBlock[];
  editor?: {
    name?: string;
    date?: string | Date;
    avatar?: string;
    socialMedia?: {
      x?: string;
      instagram?: string;
      linkedin?: string;
    };
  };
  [key: string]: unknown;
}

export default async function BlogPage({ params }: BlogPageProps) {
  try {
    const { slug } = await params;
    const client = await clientPromise;
    const db = client.db();
    
    // Find blog by slug
    const storedBlog = await db.collection('blogs').findOne({ slug });
    
    if (!storedBlog) {
      console.log('Blog not found, showing redirect handler');
      return <BlogRedirectHandler slug={slug} />;
    }
    
    // Decompress and verify the blog data
    const blog = await processDataAfterRetrieval(storedBlog) as BlogData;
    
    return (
      <BlogRenderer
        title={blog.title}
        shortDescription={blog.shortDescription}
        keywords={blog.keywords || []}
        blocks={blog.blocks || []}
        editor={blog.editor}
        type="blog"
        slug={slug}
      />
    );
  } catch (error) {
    console.error('Error fetching blog:', error);
    const { slug } = await params;
    return <BlogRedirectHandler slug={slug} />;
  }
}

// Generate metadata for the page
export async function generateMetadata({ params }: BlogPageProps) {
  try {
    const { slug } = await params;
    const client = await clientPromise;
    const db = client.db();
    
    const storedBlog = await db.collection('blogs').findOne({ slug });
    
    if (!storedBlog) {
      return {
        title: 'Blog Not Found',
        description: 'The requested blog could not be found.',
      };
    }
    
    const blog = await processDataAfterRetrieval(storedBlog) as BlogData;
    
    return {
      title: blog.title,
      description: blog.shortDescription,
      keywords: blog.keywords?.join(', '),
      openGraph: {
        title: blog.title,
        description: blog.shortDescription,
        type: 'article',
        authors: blog.editor?.name ? [blog.editor.name] : undefined,
        publishedTime: blog.editor?.date ? (typeof blog.editor.date === 'string' ? blog.editor.date : blog.editor.date.toISOString()) : undefined,
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Blog',
      description: 'Blog page',
    };
  }
}

 