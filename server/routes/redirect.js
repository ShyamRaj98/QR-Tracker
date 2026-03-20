const router = require('express').Router();
const geoip = require('geoip-lite');
const UAParser = require('ua-parser-js');
const QRCode = require('../models/QRCode');
const ShortLink = require('../models/ShortLink');
const ScanEvent = require('../models/ScanEvent');

const parseDevice = (ua) => {
  const parser = new UAParser(ua);
  const result = parser.getResult();
  let type = 'desktop';
  if (result.device.type === 'mobile') type = 'mobile';
  else if (result.device.type === 'tablet') type = 'tablet';
  return {
    type,
    os: result.os.name || 'unknown',
    browser: result.browser.name || 'unknown',
    userAgent: ua,
  };
};

const parseLocation = (ip) => {
  const geo = geoip.lookup(ip);
  if (!geo) return {};
  return {
    country: geo.country,
    countryCode: geo.country,
    region: geo.region,
    city: geo.city,
    timezone: geo.timezone,
    ll: geo.ll,
  };
};

const getClientIP = (req) => {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.connection?.remoteAddress ||
    req.ip
  );
};

// GET /r/:code — main redirect handler
router.get('/:code', async (req, res) => {
  const { code } = req.params;
  const ip = getClientIP(req);
  const ua = req.headers['user-agent'] || '';
  const referer = req.headers['referer'] || '';

  try {
    // Try QR code first, then short link
    let record = await QRCode.findOne({ shortCode: code, isActive: true });
    let refType = 'qr';

    if (!record) {
      record = await ShortLink.findOne(
        { $or: [{ shortCode: code }, { customAlias: code }], isActive: true }
      );
      refType = 'link';
    }

    if (!record) return res.status(404).send('Link not found or inactive');

    // Check expiry
    if (record.expiresAt && new Date() > record.expiresAt) {
      return res.status(410).send('This link has expired');
    }

    // Smart redirect (QR codes only)
    let destination = record.destinationUrl;
    if (refType === 'qr' && record.smartRedirects?.length > 0) {
      const device = parseDevice(ua);
      for (const rule of record.smartRedirects) {
        if (rule.condition === 'device' && rule.value.toLowerCase() === device.os.toLowerCase()) {
          destination = rule.redirectUrl;
          break;
        }
      }
    }

    // Append UTM params for short links
    if (refType === 'link') {
      const url = new URL(destination);
      if (record.utmSource) url.searchParams.set('utm_source', record.utmSource);
      if (record.utmMedium) url.searchParams.set('utm_medium', record.utmMedium);
      if (record.utmCampaign) url.searchParams.set('utm_campaign', record.utmCampaign);
      destination = url.toString();
    }

    // Track the scan event asynchronously (don't await — keep redirect fast)
    setImmediate(async () => {
      try {
        const device = parseDevice(ua);
        const location = parseLocation(ip);

        // Update aggregated counters
        const update = {
          $inc: { totalScans: 1 },
          $set: { lastScannedAt: new Date() },
        };

        // Simple uniqueness: check if IP scanned in last 24h
        const recentScan = await ScanEvent.findOne({
          refId: record._id,
          ip,
          scannedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        });
        const isUnique = !recentScan;
        if (isUnique) update.$inc.uniqueScans = 1;

        const Model = refType === 'qr' ? QRCode : ShortLink;
        const countField = refType === 'qr' ? 'totalScans' : 'totalClicks';
        const uniqueField = refType === 'qr' ? 'uniqueScans' : 'uniqueClicks';

        await Model.findByIdAndUpdate(record._id, {
          $inc: { [countField]: 1, ...(isUnique ? { [uniqueField]: 1 } : {}) },
          $set: { lastScannedAt: new Date() },
        });

        await ScanEvent.create({
          refId: record._id,
          refType,
          user: record.user,
          device,
          location,
          ip,
          referer,
          isUnique,
        });
      } catch (err) {
        console.error('Scan tracking error:', err.message);
      }
    });

    // Redirect immediately
    res.redirect(301, destination);
  } catch (err) {
    console.error('Redirect error:', err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
