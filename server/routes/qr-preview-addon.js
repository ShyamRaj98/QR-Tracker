// Add this route to server/routes/qr.js BEFORE module.exports
// It generates a preview QR image without saving to database

// POST /api/qr/preview — live preview (no auth required for speed)
router.post('/preview', async (req, res) => {
  try {
    const { destinationUrl, style } = req.body
    if (!destinationUrl) return res.status(400).json({ error: 'URL required' })
    const { generateQRDataURL } = require('../services/qrService')
    const qrImage = await generateQRDataURL(destinationUrl, style || {})
    res.json({ qrImage })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
