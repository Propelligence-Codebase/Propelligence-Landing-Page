// Blog schema for MongoDB
// This is a helper for TypeScript and validation, not enforced by MongoDB itself

export interface BlogBlock {
  type: 'heading' | 'paragraph' | 'image' | 'ul' | 'ol' | 'blockquote' | 'hr';
  content?: string;
  level?: 1 | 2 | 3 | 4 | 5;
  src?: string;
  alt?: string;
  items?: string[];
}

export interface EditorInfo {
  name: string;
  date?: Date;
  socialMedia?: {
    x?: string;
    instagram?: string;
    linkedin?: string;
  };
}

export interface Blog {
  _id?: string;
  title: string;
  shortDescription: string;
  keywords?: string[];
  blocks?: BlogBlock[];
  editor?: EditorInfo;
  slug?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
