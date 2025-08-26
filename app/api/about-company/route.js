import clientPromise from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';
import { processDataForStorage, processMultipleAfterRetrieval } from '../../../lib/dataProcessor';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    const aboutRaw = await db.collection('about_company').find({}).sort({ updatedAt: -1 }).limit(1).toArray();
    const aboutArr = await processMultipleAfterRetrieval(aboutRaw);
    const about = aboutArr[0] || null;
    return new Response(JSON.stringify(about ? [about] : []), { status: 200 });
  } catch (error) {
    console.error('Error in /api/about-company GET:', error);
    return new Response(JSON.stringify([]), { status: 200 });
  }
}

export async function POST(req) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const body = await req.json();
    const { aboutText } = body;
    if (!aboutText) {
      return new Response(JSON.stringify({ error: 'Missing aboutText' }), { status: 400 });
    }
    const processedData = await processDataForStorage({
      aboutText,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const result = await db.collection('about_company').insertOne({ ...processedData });
    return new Response(JSON.stringify({ insertedId: result.insertedId }), { status: 201 });
  } catch (error) {
    console.error('Error in /api/about-company POST:', error);
    return new Response(JSON.stringify({ error: 'Failed to create about company info' }), { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const body = await req.json();
    const { _id, aboutText } = body;
    if (!_id) {
      return new Response(JSON.stringify({ error: 'Missing _id' }), { status: 400 });
    }
    const processedData = await processDataForStorage({
      aboutText,
      updatedAt: new Date(),
    });
    const result = await db.collection('about_company').updateOne(
      { _id: new ObjectId(_id) },
      { $set: { ...processedData } }
    );
    return new Response(JSON.stringify({ modifiedCount: result.modifiedCount }), { status: 200 });
  } catch (error) {
    console.error('Error in /api/about-company PUT:', error);
    return new Response(JSON.stringify({ error: 'Failed to update about company info' }), { status: 500 });
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
    const result = await db.collection('about_company').deleteOne({ _id: new ObjectId(_id) });
    return new Response(JSON.stringify({ deletedCount: result.deletedCount }), { status: 200 });
  } catch (error) {
    console.error('Error in /api/about-company DELETE:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete about company info' }), { status: 500 });
  }
}