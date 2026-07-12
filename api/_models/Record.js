import mongoose from 'mongoose';

const RecordSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // Menggunakan UUID dari Dexie
  userId: { type: String, required: true },
  collectionName: { type: String, required: true }, // 'pages', 'bullets', 'collections', 'habits', 'habitLogs'
}, { strict: false }); // strict: false mengizinkan kolom dinamis (seperti title, text, status)

// Hindari OverwriteModelError saat hot reload di Vercel
export default mongoose.models.Record || mongoose.model('Record', RecordSchema);
