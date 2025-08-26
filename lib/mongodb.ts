import { MongoClient } from 'mongodb';

if (!process.env.DATABASE) {
  throw new Error('Please add your DATABASE environment variable to .env');
}

const uri = process.env.DATABASE;
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri, options);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

export default clientPromise;

// Add global type declaration for development mode
declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}
