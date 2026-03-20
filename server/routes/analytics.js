const router = require('express').Router();
const ScanEvent = require('../models/ScanEvent');
const QRCode = require('../models/QRCode');
const ShortLink = require('../models/ShortLink');
const { protect } = require('../middleware/auth');

// GET /api/analytics/overview — dashboard summary
router.get('/overview', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const [qrCount, linkCount, totalScans, recentScans] = await Promise.all([
      QRCode.countDocuments({ user: userId }),
      ShortLink.countDocuments({ user: userId }),
      ScanEvent.countDocuments({ user: userId }),
      ScanEvent.countDocuments({
        user: userId,
        scannedAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      }),
    ]);
    res.json({ qrCount, linkCount, totalScans, recentScans });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/:refId — detailed analytics for one QR/link
router.get('/:refId', protect, async (req, res) => {
  try {
    const { refId } = req.params;
    const { days = 30 } = req.query;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const matchStage = { $match: { refId: require('mongoose').Types.ObjectId.createFromHexString(refId), user: req.user._id, scannedAt: { $gte: since } } };

    const [scansOverTime, byDevice, byCountry, byOS, totalStats] = await Promise.all([
      // Scans grouped by day
      ScanEvent.aggregate([
        matchStage,
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$scannedAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),

      // By device type
      ScanEvent.aggregate([
        matchStage,
        { $group: { _id: '$device.type', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // By country
      ScanEvent.aggregate([
        matchStage,
        { $match: { 'location.country': { $exists: true, $ne: null } } },
        { $group: { _id: '$location.country', countryCode: { $first: '$location.countryCode' }, count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),

      // By OS
      ScanEvent.aggregate([
        matchStage,
        { $group: { _id: '$device.os', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 8 },
      ]),

      // Total & unique
      ScanEvent.aggregate([
        matchStage,
        { $group: { _id: null, total: { $sum: 1 }, unique: { $sum: { $cond: ['$isUnique', 1, 0] } } } },
      ]),
    ]);

    res.json({
      scansOverTime,
      byDevice,
      byCountry,
      byOS,
      totals: totalStats[0] || { total: 0, unique: 0 },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/:refId/recent — last 20 scan events
router.get('/:refId/recent', protect, async (req, res) => {
  try {
    const refId = require('mongoose').Types.ObjectId.createFromHexString(req.params.refId);
    const events = await ScanEvent.find({ refId, user: req.user._id })
      .sort({ scannedAt: -1 })
      .limit(20)
      .select('-__v -userAgent');
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
