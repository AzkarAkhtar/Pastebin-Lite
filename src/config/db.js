import { MongoClient } from 'mongodb';  
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGODB_URI;
if (!uri) {
  throw new Error('MONGODB_URI environment variable is required');
}

const client = new MongoClient(uri);

let db = null;

export const connectDB = async () => {
  if (db) return db;
  
  await client.connect();
  db = client.db('pastebin');
  
  // Ensure indexes
  await db.collection('pastes').createIndex({ id: 1 }, { unique: true });
  await db.collection('pastes').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  
  return db;
};

export const getDB = () => db;

export const healthCheckDB = async () => {
  const dbInstance = getDB();
  if (!dbInstance) return false;
  
  try {
    await dbInstance.command({ ping: 1 });
    return true;
  } catch {
    return false;
  }
};