import clientPromise from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';
import { processDataForStorage, processMultipleAfterRetrieval } from '../../../lib/dataProcessor';

// Safely coerce potentially formatted numeric strings (e.g., "₹5", "5 Cr", "1,234.5") to numbers
function parseNumberLike(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : NaN;
  }
  if (typeof value === 'string') {
    const lower = value.toLowerCase();
    // Remove currency symbols and commas
    const cleaned = lower.replace(/[^0-9.]/g, '');
    const parsed = parseFloat(cleaned);
    if (!Number.isFinite(parsed)) return NaN;
    return parsed;
  }
  return NaN;
}

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    const statsRaw = await db.collection('statistics').find({}).toArray();
    const stats = await processMultipleAfterRetrieval(statsRaw);
    if (!Array.isArray(stats) || stats.length === 0) {
      return new Response(JSON.stringify([]), { status: 200 });
    }
    // Choose the most recently updated statistics document
    const latest = stats.reduce((latestDoc, currentDoc) => {
      const latestUpdatedAt = latestDoc?.updatedAt ? new Date(latestDoc.updatedAt).getTime() : 0;
      const currentUpdatedAt = currentDoc?.updatedAt ? new Date(currentDoc.updatedAt).getTime() : 0;
      return currentUpdatedAt > latestUpdatedAt ? currentDoc : latestDoc;
    }, stats[0]);
    // Normalize types to numbers to satisfy client expectations
    const normalized = {
      ...latest,
      yearsExperience: parseNumberLike(latest.yearsExperience) || 0,
      clientsServed: parseNumberLike(latest.clientsServed) || 0,
      assetsManaged: parseNumberLike(latest.assetsManaged) || 0,
    };
    const response = [normalized];
    console.log('API /api/statistics GET returning latest:', response);
    return new Response(JSON.stringify(response), { status: 200 });
  } catch (error) {
    console.error('Error in /api/statistics GET:', error);
    return new Response(JSON.stringify([]), { status: 200 });
  }
}

export async function POST(req) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const body = await req.json();
    let { yearsExperience, clientsServed, assetsManaged } = body;
    // Coerce potential string inputs to numbers (accept formats like "₹5", "5 Cr", "1,234.5")
    yearsExperience = parseNumberLike(yearsExperience);
    clientsServed = parseNumberLike(clientsServed);
    assetsManaged = parseNumberLike(assetsManaged);
    if (
      typeof yearsExperience !== 'number' ||
      typeof clientsServed !== 'number' ||
      typeof assetsManaged !== 'number'
    ) {
      return new Response(JSON.stringify({ error: 'Invalid input' }), { status: 400 });
    }
    // Compress and hash the data before storing
    const processedData = await processDataForStorage({ yearsExperience, clientsServed, assetsManaged, createdAt: new Date(), updatedAt: new Date() });
    const result = await db.collection('statistics').insertOne({ ...processedData });
    return new Response(JSON.stringify({ insertedId: result.insertedId }), { status: 201 });
  } catch (error) {
    console.error('Error in /api/statistics POST:', error);
    return new Response(JSON.stringify({ error: 'Failed to create statistics' }), { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const body = await req.json();
    const { _id } = body;
    let { yearsExperience, clientsServed, assetsManaged } = body;
    if (!_id) {
      return new Response(JSON.stringify({ error: 'Missing _id' }), { status: 400 });
    }
    // Coerce potential string inputs to numbers (accept formats like "₹5", "5 Cr", "1,234.5")
    yearsExperience = parseNumberLike(yearsExperience);
    clientsServed = parseNumberLike(clientsServed);
    assetsManaged = parseNumberLike(assetsManaged);
    if (
      typeof yearsExperience !== 'number' ||
      typeof clientsServed !== 'number' ||
      typeof assetsManaged !== 'number' ||
      Number.isNaN(yearsExperience) ||
      Number.isNaN(clientsServed) ||
      Number.isNaN(assetsManaged)
    ) {
      return new Response(JSON.stringify({ error: 'Invalid input' }), { status: 400 });
    }
    // Compress and hash the data before updating
    const processedData = await processDataForStorage({ yearsExperience, clientsServed, assetsManaged, updatedAt: new Date() });
    const result = await db.collection('statistics').updateOne(
      { _id: new ObjectId(_id) },
      { $set: { ...processedData } }
    );
    return new Response(JSON.stringify({ modifiedCount: result.modifiedCount }), { status: 200 });
  } catch (error) {
    console.error('Error in /api/statistics PUT:', error);
    return new Response(JSON.stringify({ error: 'Failed to update statistics' }), { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const body = await req.json();
    const { _id } = body;
    if (!_id) {
      return new Response(JSON.stringify({ error: 'Missing _id' }), { status: 400 });
    }
    const result = await db.collection('statistics').deleteOne({ _id: new ObjectId(_id) });
    return new Response(JSON.stringify({ deletedCount: result.deletedCount }), { status: 200 });
  } catch (error) {
    console.error('Error in /api/statistics DELETE:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete statistics' }), { status: 500 });
  }
}