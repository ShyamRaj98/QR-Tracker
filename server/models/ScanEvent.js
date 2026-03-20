const mongoose = require('mongoose');

const scanEventSchema = new mongoose.Schema({
  // Reference — either a QR code or a short link
  refId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  refType: { type: String, enum: ['qr', 'link'], required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

  // Device info
  device: {
    type: { type: String, enum: ['mobile', 'tablet', 'desktop', 'bot', 'unknown'], default: 'unknown' },
    os: String,
    browser: String,
    userAgent: String,
  },

  // Location info (from geoip-lite)
  location: {
    country: String,
    countryCode: String,
    region: String,
    city: String,
    timezone: String,
    ll: [Number], // [lat, lon]
  },

  // Request metadata
  ip: String,
  referer: String,
  isUnique: { type: Boolean, default: true },

  scannedAt: { type: Date, default: Date.now },
}, { timestamps: false });

// TTL index — auto-delete events after 1 year
scanEventSchema.index({ scannedAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

// Compound index for fast aggregations
scanEventSchema.index({ refId: 1, scannedAt: -1 });
scanEventSchema.index({ user: 1, scannedAt: -1 });

module.exports = mongoose.model('ScanEvent', scanEventSchema);
