require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const qrRoutes = require('./routes/qr');
const linkRoutes = require('./routes/links');
const analyticsRoutes = require('./routes/analytics');
const redirectRoutes = require('./routes/redirect');

const app = express();

// Security
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: [
    'http://localhost:5173',
    process.env.CLIENT_URL
  ],
  credentials: true,
}));

// Logging
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Global rate limiter
app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Too many requests, please try again later.' },
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/links', linkRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/r', redirectRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// 404 handler
app.use((req, res) => res.status(404).json({ error: 'Route not found' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// Validate required env vars before connecting
const PORT = process.env.PORT || 5000;

if (!process.env.MONGODB_URI || process.env.MONGODB_URI.includes('YOUR_USERNAME')) {
  console.error('\n❌  MONGODB_URI not configured.');
  console.error('   Edit server/.env and replace YOUR_USERNAME / YOUR_PASSWORD with your MongoDB Atlas credentials.');
  console.error('   Get your URI from: https://cloud.mongodb.com → Connect → Drivers\n');
  process.exit(1);
}

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 16) {
  console.error('\n❌  JWT_SECRET not set in server/.env — please set a string of at least 16 characters.\n');
  process.exit(1);
}

// Connect to MongoDB & start server
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅  MongoDB connected');
    app.listen(PORT, () => console.log(`🚀  Server running on http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error('❌  MongoDB connection failed:', err.message);
    process.exit(1);
  });

module.exports = app;
