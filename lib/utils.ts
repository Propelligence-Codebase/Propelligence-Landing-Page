import { BlogBlock } from './blogSchema';

/**
 * Generate a URL-friendly slug from a title
 * @param title - The title to convert to a slug
 * @returns A URL-friendly slug
 */
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .substring(0, 60); // Limit length for SEO
}

/**
 * Compress blocks by removing empty blocks and trimming content
 * @param blocks - Array of blog blocks
 * @returns Compressed array of blocks
 */
export function compressBlocks(blocks: BlogBlock[]): BlogBlock[] {
  return blocks
    .map(block => {
      // Basic text blocks
      if (block.type === 'heading' || block.type === 'paragraph' || block.type === 'blockquote') {
        if (!block.content?.trim()) return null;
        return { ...block, content: block.content.trim() };
      }
      
      // List blocks
      if (block.type === 'ul' || block.type === 'ol') {
        const filteredItems = block.items?.filter(item => item.trim()) || [];
        if (filteredItems.length === 0) return null;
        return { ...block, items: filteredItems.map(item => item.trim()) };
      }
      
      // Image blocks
      if (block.type === 'image') {
        if (!block.src?.trim()) return null;
        return { ...block, src: block.src.trim(), alt: block.alt?.trim() || '' };
      }
      
      // Keep other blocks as they are (hr, etc.)
      return block;
    })
    .filter(Boolean) as BlogBlock[];
}

/**
 * Validate if a slug is unique in the database
 * @param slug - The slug to check
 * @param collection - The collection to check in ('blogs' or 'services')
 * @param excludeId - ID to exclude from check (for updates)
 * @returns Promise<boolean> - true if unique, false if exists
 */
export async function isSlugUnique(slug: string, collection: 'blogs' | 'services', excludeId?: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/${collection}/check-slug?slug=${encodeURIComponent(slug)}${excludeId ? `&excludeId=${excludeId}` : ''}`);
    const data = await response.json();
    return data.isUnique;
  } catch (error) {
    console.error('Error checking slug uniqueness:', error);
    return false;
  }
}

/**
 * Generate a unique slug by appending a number if needed
 * @param title - The title to generate slug from
 * @param collection - The collection to check in
 * @param excludeId - ID to exclude from check (for updates)
 * @returns Promise<string> - A unique slug
 */
export async function generateUniqueSlug(title: string, collection: 'blogs' | 'services', excludeId?: string): Promise<string> {
  const baseSlug = generateSlug(title);
  let slug = baseSlug;
  let counter = 1;
  
  try {
    while (!(await isSlugUnique(slug, collection, excludeId))) {
      slug = `${baseSlug}-${counter}`;
      counter++;
      
      // Prevent infinite loop
      if (counter > 100) {
        console.warn('Slug generation reached limit, using timestamp');
        slug = `${baseSlug}-${Date.now()}`;
        break;
      }
    }
  } catch (error) {
    console.error('Error generating unique slug:', error);
    // Fallback to timestamp-based slug
    slug = `${baseSlug}-${Date.now()}`;
  }
  
  return slug;
} 