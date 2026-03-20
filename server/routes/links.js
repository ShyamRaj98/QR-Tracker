const router = require('express').Router();
const { nanoid } = require('nanoid');
const ShortLink = require('../models/ShortLink');
const { protect } = require('../middleware/auth');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

// GET /api/links
router.get('/', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const query = { user: req.user._id };
    if (search) query.name = { $regex: search, $options: 'i' };

    const [links, total] = await Promise.all([
      ShortLink.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)),
      ShortLink.countDocuments(query),
    ]);

    const results = links.map(l => ({
      ...l.toObject(),
      shortUrl: `${BASE_URL}/r/${l.customAlias || l.shortCode}`,
    }));

    res.json({ data: results, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/links
router.post('/', protect, async (req, res) => {
  try {
    const { name, destinationUrl, customAlias, utmSource, utmMedium, utmCampaign, tags, expiresAt } = req.body;
    if (!name || !destinationUrl) return res.status(400).json({ error: 'Name and destination URL required' });

    const count = await ShortLink.countDocuments({ user: req.user._id });
    if (count >= req.user.limits.shortLinks) {
      return res.status(403).json({ error: `Short link limit (${req.user.limits.shortLinks}) reached. Upgrade your plan.` });
    }

    if (customAlias) {
      const exists = await ShortLink.findOne({ customAlias });
      if (exists) return res.status(400).json({ error: 'Custom alias already taken' });
    }

    const shortCode = nanoid(7);
    const link = await ShortLink.create({
      user: req.user._id, name, shortCode, destinationUrl,
      customAlias, utmSource, utmMedium, utmCampaign, tags, expiresAt,
    });

    res.status(201).json({
      ...link.toObject(),
      shortUrl: `${BASE_URL}/r/${customAlias || shortCode}`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/links/:id
router.put('/:id', protect, async (req, res) => {
  try {
    const update = req.body;
    const link = await ShortLink.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      update,
      { new: true }
    );
    if (!link) return res.status(404).json({ error: 'Short link not found' });
    res.json({ ...link.toObject(), shortUrl: `${BASE_URL}/r/${link.customAlias || link.shortCode}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/links/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const link = await ShortLink.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!link) return res.status(404).json({ error: 'Short link not found' });
    res.json({ message: 'Link deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
