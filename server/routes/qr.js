const router = require('express').Router();
const { nanoid } = require('nanoid');
const QRCode = require('../models/QRCode');
const { protect } = require('../middleware/auth');
const { generateQRDataURL, generateQRSVG } = require('../services/qrService');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

// GET /api/qr — list all QR codes for user
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, tag } = req.query;
    const query = { user: req.user._id };
    if (search) query.name = { $regex: search, $options: 'i' };
    if (tag) query.tags = tag;

    const [qrCodes, total] = await Promise.all([
      QRCode.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)),
      QRCode.countDocuments(query),
    ]);

    // Attach the short URL and QR image to each code
    const results = await Promise.all(qrCodes.map(async (qr) => {
      const shortUrl = `${BASE_URL}/r/${qr.shortCode}`;
      const qrImage = await generateQRDataURL(shortUrl, qr.style);
      return { ...qr.toObject(), shortUrl, qrImage };
    }));

    res.json({ data: results, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/qr — create new QR code
router.post('/', protect, async (req, res) => {
  try {
    const { name, destinationUrl, type, style, smartRedirects, tags, expiresAt } = req.body;
    if (!name || !destinationUrl) return res.status(400).json({ error: 'Name and destination URL required' });

    // Check plan limits
    // const count = await QRCode.countDocuments({ user: req.user._id });
    // if (count >= req.user.limits.qrCodes) {
    //   return res.status(403).json({ error: `QR code limit (${req.user.limits.qrCodes}) reached. Upgrade your plan.` });
    // }

    const shortCode = nanoid(8);
    const qr = await QRCode.create({
      user: req.user._id,
      name,
      shortCode,
      destinationUrl,
      type: type || 'url',
      style: style || {},
      smartRedirects: smartRedirects || [],
      tags: tags || [],
      expiresAt,
    });

    const shortUrl = `${BASE_URL}/r/${shortCode}`;
    const qrImage = await generateQRDataURL(shortUrl, qr.style);
    const qrSVG = await generateQRSVG(shortUrl, qr.style);

    res.status(201).json({ ...qr.toObject(), shortUrl, qrImage, qrSVG });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/qr/:id — get single QR code
router.get('/:id', protect, async (req, res) => {
  try {
    const qr = await QRCode.findOne({ _id: req.params.id, user: req.user._id });
    if (!qr) return res.status(404).json({ error: 'QR code not found' });
    const shortUrl = `${BASE_URL}/r/${qr.shortCode}`;
    const qrImage = await generateQRDataURL(shortUrl, qr.style);
    res.json({ ...qr.toObject(), shortUrl, qrImage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/qr/:id — update QR code (dynamic = no reprinting needed)
router.put('/:id', protect, async (req, res) => {
  try {
    const { name, destinationUrl, style, smartRedirects, tags, isActive, expiresAt } = req.body;
    const qr = await QRCode.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { name, destinationUrl, style, smartRedirects, tags, isActive, expiresAt },
      { new: true, runValidators: true }
    );
    if (!qr) return res.status(404).json({ error: 'QR code not found' });
    const shortUrl = `${BASE_URL}/r/${qr.shortCode}`;
    const qrImage = await generateQRDataURL(shortUrl, qr.style);
    res.json({ ...qr.toObject(), shortUrl, qrImage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/qr/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const qr = await QRCode.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!qr) return res.status(404).json({ error: 'QR code not found' });
    res.json({ message: 'QR code deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/qr/:id/image?format=svg|png — download QR image
router.get('/:id/image', protect, async (req, res) => {
  try {
    const qr = await QRCode.findOne({ _id: req.params.id, user: req.user._id });
    if (!qr) return res.status(404).json({ error: 'QR code not found' });
    const shortUrl = `${BASE_URL}/r/${qr.shortCode}`;
    const format = req.query.format || 'png';

    if (format === 'svg') {
      const svg = await generateQRSVG(shortUrl, qr.style);
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Content-Disposition', `attachment; filename="${qr.name}.svg"`);
      return res.send(svg);
    }

    const dataUrl = await generateQRDataURL(shortUrl, qr.style);
    const base64 = dataUrl.split(',')[1];
    const buffer = Buffer.from(base64, 'base64');
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="${qr.name}.png"`);
    res.send(buffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
