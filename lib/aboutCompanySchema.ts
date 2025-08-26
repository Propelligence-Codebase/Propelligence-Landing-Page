// About Company schema for MongoDB
// This is a helper for TypeScript and validation, not enforced by MongoDB itself

export interface AboutCompany {
  _id?: string;
  aboutText: string;
  createdAt?: Date;
  updatedAt?: Date;
}