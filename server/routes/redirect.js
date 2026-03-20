const router = require('express').Router();
const geoip = require('geoip-lite');
const UAParser = require('ua-parser-js');
const QRCode = require('../models/QRCode');
const ScanEvent = require('../models/ScanEvent');

const parseDevice = (ua) => {
  const r = new UAParser(ua).getResult();
  return {
    type: r.device.type === 'mobile' ? 'mobile' : r.device.type === 'tablet' ? 'tablet' : 'desktop',
    os: r.os.name || 'unknown',
    browser: r.browser.name || 'unknown',
    userAgent: ua,
  };
};

const parseLocation = (ip) => {
  const geo = geoip.lookup(ip);
  if (!geo) return {};
  return { country: geo.country, countryCode: geo.country, region: geo.region, city: geo.city, timezone: geo.timezone, ll: geo.ll };
};

const getIP = (req) =>
  req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.connection?.remoteAddress || req.ip;

router.get('/:code', async (req, res) => {
  const { code } = req.params;
  const ip = getIP(req);
  const ua = req.headers['user-agent'] || '';

  try {
    const record = await QRCode.findOne({ shortCode: code, isActive: true });
    if (!record) return res.status(404).send('QR code not found or inactive');

    if (record.expiresAt && new Date() > record.expiresAt)
      return res.status(410).send('This QR code has expired');

    // Smart redirect by device OS
    let destination = record.destinationUrl;
    if (record.smartRedirects?.length) {
      const device = parseDevice(ua);
      for (const rule of record.smartRedirects) {
        if (rule.condition === 'device' && rule.value.toLowerCase() === device.os.toLowerCase()) {
          destination = rule.redirectUrl;
          break;
        }
      }
    }

    // Track async — don't slow down the redirect
    setImmediate(async () => {
      try {
        const device = parseDevice(ua);
        const location = parseLocation(ip);
        const recentScan = await ScanEvent.findOne({
          refId: record._id, ip,
          scannedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        });
        const isUnique = !recentScan;

        await QRCode.findByIdAndUpdate(record._id, {
          $inc: { totalScans: 1, ...(isUnique ? { uniqueScans: 1 } : {}) },
          $set: { lastScannedAt: new Date() },
        });

        await ScanEvent.create({ refId: record._id, refType: 'qr', device, location, ip, referer: req.headers['referer'] || '', isUnique });
      } catch (err) {
        console.error('Scan tracking error:', err.message);
      }
    });

    res.redirect(301, destination);
  } catch (err) {
    console.error('Redirect error:', err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
