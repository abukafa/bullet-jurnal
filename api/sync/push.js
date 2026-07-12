import connectToDatabase from '../_lib/db.js';
import Record from '../_models/Record.js';
import { verifyAuth } from '../_lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const user = verifyAuth(req);
    await connectToDatabase();

    const { changes } = req.body;
    
    // changes is an object { collectionName: [records] }
    if (changes) {
      const incomingIds = [];
      const incomingMap = new Map();

      for (const [collectionName, records] of Object.entries(changes)) {
        for (const record of records) {
          incomingIds.push(record.id);
          incomingMap.set(record.id, { ...record, collectionName });
        }
      }

      if (incomingIds.length > 0) {
        // Fetch existing records to compare timestamps
        const existingRecords = await Record.find({ _id: { $in: incomingIds }, userId: user.userId }).lean();
        const existingMap = new Map(existingRecords.map(r => [r._id, r]));

        const operations = [];

        for (const [id, record] of incomingMap.entries()) {
          const existing = existingMap.get(id);
          
          // Last Write Wins (LWW) Resolution
          const incomingTime = new Date(record.updatedAt).getTime();
          const existingTime = existing ? new Date(existing.updatedAt).getTime() : 0;

          if (!existing || incomingTime > existingTime) {
            operations.push({
              updateOne: {
                filter: { _id: id, userId: user.userId },
                update: { 
                  $set: { 
                    ...record, 
                    _id: id,
                    userId: user.userId 
                  }
                },
                upsert: true
              }
            });
          }
        }

        if (operations.length > 0) {
          await Record.bulkWrite(operations, { ordered: false });
        }
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Push error:', error);
    res.status(401).json({ error: error.message || 'Unauthorized' });
  }
}
