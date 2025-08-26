// Statistics schema for MongoDB
// This is a helper for TypeScript and validation, not enforced by MongoDB itself

export interface Statistics {
  _id?: string;
  yearsExperience: number;
  clientsServed: number;
  assetsManaged: number;
  createdAt?: Date;
  updatedAt?: Date;
}