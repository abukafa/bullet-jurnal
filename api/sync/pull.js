import connectToDatabase from '../_lib/db.js';
import Record from '../_models/Record.js';
import { verifyAuth } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const user = verifyAuth(req);
    await connectToDatabase();

    const { lastSyncTime } = req.body;
    
    let query = { userId: user.userId };
    
    if (lastSyncTime) {
      query.updatedAt = { $gt: new Date(lastSyncTime) };
    }

    const records = await Record.find(query).lean();
    
    // Group records by collectionName
    const changes = {};
    records.forEach(record => {
      if (!changes[record.collectionName]) {
        changes[record.collectionName] = [];
      }
      changes[record.collectionName].push(record);
    });

    res.json({
      changes,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Pull error:', error);
    res.status(401).json({ error: error.message || 'Unauthorized' });
  }
}
