import clientPromise from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';
import { processDataForStorage, processMultipleAfterRetrieval } from '../../../lib/dataProcessor';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    const foundersRaw = await db.collection('founders').find({}).toArray();
    const founders = await processMultipleAfterRetrieval(foundersRaw);
    return new Response(JSON.stringify(founders), { status: 200 });
  } catch (error) {
    console.error('Error in /api/founders GET:', error);
    return new Response(JSON.stringify([]), { status: 200 });
  }
}

export async function POST(req) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const body = await req.json();
    const { name, title, desc, imageBase64, insta_link, x_link, linkdin_link } = body;
    if (!name || !title || !desc) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
    }
    const processedData = await processDataForStorage({
      name,
      title,
      desc,
      imageBase64: imageBase64 || null,
      insta_link: insta_link || null,
      x_link: x_link || null,
      linkdin_link: linkdin_link || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const result = await db.collection('founders').insertOne({ ...processedData });
    return new Response(JSON.stringify({ insertedId: result.insertedId }), { status: 201 });
  } catch (error) {
    console.error('Error in /api/founders POST:', error);
    return new Response(JSON.stringify({ error: 'Failed to create founder' }), { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const client = await clientPromise;
    const db = client.db();
    const body = await req.json();
    const { _id, name, title, desc, imageBase64, insta_link, x_link, linkdin_link } = body;
    if (!_id) {
      return new Response(JSON.stringify({ error: 'Missing _id' }), { status: 400 });
    }
    const processedData = await processDataForStorage({
      name,
      title,
      desc,
      imageBase64: imageBase64 || null,
      insta_link: insta_link || null,
      x_link: x_link || null,
      linkdin_link: linkdin_link || null,
      updatedAt: new Date(),
    });
    const result = await db.collection('founders').updateOne(
      { _id: new ObjectId(_id) },
      { $set: { ...processedData } }
    );
    return new Response(JSON.stringify({ modifiedCount: result.modifiedCount }), { status: 200 });
  } catch (error) {
    console.error('Error in /api/founders PUT:', error);
    return new Response(JSON.stringify({ error: 'Failed to update founder' }), { status: 500 });
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
    const result = await db.collection('founders').deleteOne({ _id: new ObjectId(_id) });
    return new Response(JSON.stringify({ deletedCount: result.deletedCount }), { status: 200 });
  } catch (error) {
    console.error('Error in /api/founders DELETE:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete founder' }), { status: 500 });
  }
}