import crypto from 'crypto';
import { connectDB, getDB, healthCheckDB } from '../config/db.js';

const pastesCollection = () => {
  const db = getDB();
  return db?.collection('pastes');
};

// Health check uses MongoDB ping
export const healthCheck = async () => {
  return await healthCheckDB();
};

// Create paste
export const createPaste = async ({ content, ttl_seconds, max_views }, now) => {
  const db = await connectDB();
  const collection = pastesCollection();
  
  const id = crypto.randomBytes(8).toString('hex');

  let expiresAt = null;
  if (ttl_seconds !== undefined && ttl_seconds !== null) {
    expiresAt = new Date(now.getTime() + ttl_seconds * 1000);
  }

  const paste = {
    id,
    content,
    created_at: now,
    expiresAt,
    max_views: max_views !== undefined ? max_views : null,
    view_count: 0
  };

  const result = await collection.insertOne(paste);
  
  if (!result.acknowledged) {
    throw new Error('Failed to create paste');
  }
  
  return paste;
};

// Get paste (checks availability)
export const getPaste = async (id) => {
  const collection = pastesCollection();
  if (!collection) return null;
  
  const paste = await collection.findOne({ id });
  if (!paste) return null;
  
  return paste;
};

// Check if unavailable (TTL or view limit)
export const isUnavailable = (paste, now) => {
  if (paste.expiresAt && now >= paste.expiresAt) return true;
  if (paste.max_views != null && paste.view_count >= paste.max_views) return true;
  return false;
};

// Increment view count (atomic update)
export const incrementViewCount = async (id) => {
  const collection = pastesCollection();
  if (!collection) return;
  
  try {
    await collection.updateOne(
      { id },
      { 
        $inc: { view_count: 1 },
        $setOnInsert: { view_count: 0 } // safety
      }
    );
  } catch (err) {
    console.error('Failed to increment view count:', err);
  }
};