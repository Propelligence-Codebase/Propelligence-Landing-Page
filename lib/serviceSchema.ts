// Service schema for MongoDB
// This is a helper for TypeScript and validation, not enforced by MongoDB itself

export interface ServiceBlock {
  type: 'heading' | 'paragraph' | 'image' | 'ul' | 'ol' | 'blockquote' | 'hr';
  content?: string;
  level?: 1 | 2 | 3 | 4 | 5;
  src?: string;
  alt?: string;
  items?: string[];
}

export interface Service {
  _id?: string;
  title: string;
  shortDescription: string;
  keywords?: string[];
  blocks?: ServiceBlock[];
  slug?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
