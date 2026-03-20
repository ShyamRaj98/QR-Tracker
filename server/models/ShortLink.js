const mongoose = require('mongoose');

const shortLinkSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true },
  shortCode: { type: String, required: true, unique: true, index: true },
  destinationUrl: { type: String, required: true },
  customAlias: { type: String, sparse: true, unique: true },
  isActive: { type: Boolean, default: true },

  // UTM params auto-append
  utmSource: String,
  utmMedium: String,
  utmCampaign: String,

  totalClicks: { type: Number, default: 0 },
  uniqueClicks: { type: Number, default: 0 },
  lastClickedAt: { type: Date },

  expiresAt: { type: Date },
  tags: [{ type: String, trim: true }],
}, { timestamps: true });

module.exports = mongoose.model('ShortLink', shortLinkSchema);
