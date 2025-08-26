// Founder (Board Member) schema for MongoDB
// This is a helper for TypeScript and validation, not enforced by MongoDB itself

export interface Founder {
  _id?: string;
  name: string;
  title: string;
  desc: string;
  imageBase64?: string | null;
  insta_link?: string | null;
  x_link?: string | null;
  linkdin_link?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}