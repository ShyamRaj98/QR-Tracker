const mongoose = require('mongoose');

const qrCodeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true },
  shortCode: { type: String, required: true, unique: true, index: true },
  destinationUrl: { type: String, required: true },
  type: { type: String, enum: ['url', 'vcard', 'text', 'wifi', 'email'], default: 'url' },
  isDynamic: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },

  // QR appearance
  style: {
    foregroundColor: { type: String, default: '#000000' },
    backgroundColor: { type: String, default: '#ffffff' },
    errorCorrectionLevel: { type: String, enum: ['L', 'M', 'Q', 'H'], default: 'M' },
    margin: { type: Number, default: 4 },
  },

  // Smart redirects
  smartRedirects: [{
    condition: { type: String, enum: ['device', 'country', 'language'] },
    value: String,
    redirectUrl: String,
  }],

  // Aggregated stats (updated on each scan for quick reads)
  totalScans: { type: Number, default: 0 },
  uniqueScans: { type: Number, default: 0 },
  lastScannedAt: { type: Date },

  expiresAt: { type: Date },
  tags: [{ type: String, trim: true }],
}, { timestamps: true });

module.exports = mongoose.model('QRCode', qrCodeSchema);
