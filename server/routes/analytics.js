const router = require('express').Router();
const ScanEvent = require('../models/ScanEvent');
const QRCode = require('../models/QRCode');
const { protect } = require('../middleware/auth');
const mongoose = require('mongoose');

// GET /api/analytics/overview — company-wide dashboard summary
router.get('/overview', protect, async (req, res) => {
  try {
    const [qrCount, totalScans, recentScans] = await Promise.all([
      QRCode.countDocuments(),
      ScanEvent.countDocuments(),
      ScanEvent.countDocuments({
        scannedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      }),
    ]);
    res.json({ qrCount, totalScans, recentScans });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/:refId — detailed analytics for one QR code
router.get('/:refId', protect, async (req, res) => {
  try {
    const refId = mongoose.Types.ObjectId.createFromHexString(req.params.refId);
    const { days = 30 } = req.query;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const matchStage = { $match: { refId, scannedAt: { $gte: since } } };

    const [scansOverTime, byDevice, byCountry, byOS, totalStats] = await Promise.all([
      ScanEvent.aggregate([
        matchStage,
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$scannedAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      ScanEvent.aggregate([
        matchStage,
        { $group: { _id: '$device.type', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      ScanEvent.aggregate([
        matchStage,
        { $match: { 'location.country': { $exists: true, $ne: null } } },
        { $group: { _id: '$location.country', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
      ScanEvent.aggregate([
        matchStage,
        { $group: { _id: '$device.os', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),
      ScanEvent.aggregate([
        matchStage,
        { $group: { _id: null, total: { $sum: 1 }, unique: { $sum: { $cond: ['$isUnique', 1, 0] } } } },
      ]),
    ]);

    res.json({ scansOverTime, byDevice, byCountry, byOS, totals: totalStats[0] || { total: 0, unique: 0 } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/:refId/recent
router.get('/:refId/recent', protect, async (req, res) => {
  try {
    const refId = mongoose.Types.ObjectId.createFromHexString(req.params.refId);
    const events = await ScanEvent.find({ refId })
      .sort({ scannedAt: -1 })
      .limit(20)
      .select('-__v -device.userAgent');
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
