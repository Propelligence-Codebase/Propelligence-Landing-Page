import { gzip, gunzip } from 'zlib';
import {  createHmac } from 'crypto';
import { promisify } from 'util';

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

// Secret key for hashing (should be in environment variables in production)
const HASH_SECRET = process.env.HASH_SECRET || 'your-secret-key-here';

/**
 * Compress and hash data before storing in database
 * @param {Object} data - The data to compress and hash
 * @returns {Object} - Object containing compressed data and hash
 */
export async function compressAndHash(data) {
  try {
    // Convert data to JSON string
    const jsonString = JSON.stringify(data);
    
    // Compress the data using gzip
    const compressed = await gzipAsync(jsonString);
    const compressedBase64 = compressed.toString('base64');
    
    // Create hash of the original data for integrity verification
    const hash = createHmac('sha256', HASH_SECRET)
      .update(jsonString)
      .digest('hex');
    
    return {
      compressedData: compressedBase64,
      hash: hash,
      originalSize: jsonString.length,
      compressedSize: compressed.length,
      compressionRatio: ((jsonString.length - compressed.length) / jsonString.length * 100).toFixed(2)
    };
  } catch (error) {
    console.error('Error compressing and hashing data:', error);
    throw new Error('Failed to compress and hash data');
  }
}

/**
 * Decompress and verify data after fetching from database
 * @param {Object} storedData - The stored data object with compressedData and hash
 * @returns {Object} - The original decompressed data
 */
export async function decompressAndVerify(storedData) {
  try {
    if (!storedData.compressedData || !storedData.hash) {
      // If data is not compressed (legacy data), return as is
      return storedData;
    }
    
    // Decompress the data
    const compressedBuffer = Buffer.from(storedData.compressedData, 'base64');
    const decompressed = await gunzipAsync(compressedBuffer);
    const jsonString = decompressed.toString('utf8');
    
    // Parse the JSON data
    const data = JSON.parse(jsonString);
    
    // Verify hash integrity
    const expectedHash = createHmac('sha256', HASH_SECRET)
      .update(jsonString)
      .digest('hex');
    
    if (storedData.hash !== expectedHash) {
      throw new Error('Data integrity check failed - hash mismatch');
    }
    
    return data;
  } catch (error) {
    console.error('Error decompressing and verifying data:', error);
    throw new Error('Failed to decompress and verify data');
  }
}

/**
 * Process data for insertion/update (compress and hash)
 * @param {Object} data - The data to process
 * @returns {Object} - Processed data ready for database storage
 */
export async function processDataForStorage(data) {
  const { compressedData, hash, originalSize, compressedSize, compressionRatio } = await compressAndHash(data);
  
  return {
    compressedData,
    hash,
    metadata: {
      originalSize,
      compressedSize,
      compressionRatio: parseFloat(compressionRatio),
      processedAt: new Date().toISOString(),
      version: '1.0'
    }
  };
}

/**
 * Process data after retrieval (decompress and verify)
 * @param {Object} storedData - The stored data from database
 * @returns {Object} - The original data with preserved _id and slug
 */
export async function processDataAfterRetrieval(storedData) {
  // Preserve the MongoDB _id, slug, and notes fields
  const { _id, slug, notes, ...dataToDecompress } = storedData;
  
  console.log('Processing data after retrieval:', { _id, hasNotes: !!notes, notesCount: notes?.length });
  
  // Decompress the data
  const decompressedData = await decompressAndVerify(dataToDecompress);
  
  // Return the decompressed data with the preserved _id, slug, and notes
  const result = {
    _id,
    slug,
    notes,
    ...decompressedData
  };
  
  console.log('Processed data result:', { _id: result._id, hasNotes: !!result.notes, notesCount: result.notes?.length });
  
  return result;
}

/**
 * Process multiple documents for storage
 * @param {Array} documents - Array of documents to process
 * @returns {Array} - Array of processed documents
 */
export async function processMultipleForStorage(documents) {
  const processedDocs = [];
  for (const doc of documents) {
    const processed = await processDataForStorage(doc);
    processedDocs.push(processed);
  }
  return processedDocs;
}

/**
 * Process multiple documents after retrieval
 * @param {Array} storedDocuments - Array of stored documents
 * @returns {Array} - Array of original documents with preserved _id fields
 */
export async function processMultipleAfterRetrieval(storedDocuments) {
  const processedDocs = [];
  for (const doc of storedDocuments) {
    const processed = await processDataAfterRetrieval(doc);
    processedDocs.push(processed);
  }
  return processedDocs;
} 