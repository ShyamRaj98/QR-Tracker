const mongoose = require('mongoose');

const scanEventSchema = new mongoose.Schema({
  refId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  refType: { type: String, enum: ['qr', 'link'], required: true },

  device: {
    type: { type: String, enum: ['mobile', 'tablet', 'desktop', 'bot', 'unknown'], default: 'unknown' },
    os: String,
    browser: String,
    userAgent: String,
  },

  location: {
    country: String,
    countryCode: String,
    region: String,
    city: String,
    timezone: String,
    ll: [Number],
  },

  ip: String,
  referer: String,
  isUnique: { type: Boolean, default: true },
  scannedAt: { type: Date, default: Date.now },
}, { timestamps: false });

// TTL — auto-delete after 2 years
scanEventSchema.index({ scannedAt: 1 }, { expireAfterSeconds: 2 * 365 * 24 * 60 * 60 });
scanEventSchema.index({ refId: 1, scannedAt: -1 });

module.exports = mongoose.model('ScanEvent', scanEventSchema);
