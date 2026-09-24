require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const { globalLimiter } = require('./middleware/rateLimiters');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const { ensureStore } = require('./config/db');
const { seedAdmin } = require('./utils/adminSeed');

const authRoutes = require('./routes/authRoutes');
const menuRoutes = require('./routes/menuRoutes');
const ordersRoutes = require('./routes/ordersRoutes');
const configRoutes = require('./routes/configRoutes');
const premiumRoutes = require('./routes/premiumRoutes');
const { UPLOAD_ROOT } = require('./middleware/upload');

// Fail fast if critical secrets are missing/placeholder in production.
if (process.env.NODE_ENV === 'production') {
  const required = ['JWT_SECRET', 'ID_ENCRYPTION_KEY'];
  for (const key of required) {
    if (!process.env[key] || process.env[key].startsWith('replace_this')) {
      console.error(`Missing required env var: ${key}. Refusing to start in production.`);
      process.exit(1);
    }
  }
}

ensureStore();
seedAdmin().catch((err) => console.error('Admin seed failed:', err.message));

const app = express();

app.set('trust proxy', 1);
// Helmet's default cross-origin-resource-policy blocks images being loaded
// from the frontend origin — relax it just for the /uploads static route below.
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
const allowedOrigins = (process.env.FRONTEND_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser requests (curl, Safaricom's server-to-server callback) with no Origin header.
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '100kb' })); // capped body size
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(globalLimiter);

// Uploaded menu images — served as static files.
app.use('/uploads', express.static(UPLOAD_ROOT));

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'uptown-backend' }));

app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/config', configRoutes);
app.use('/api/premium', premiumRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`UP TOWN backend running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});

module.exports = app;
