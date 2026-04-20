require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const batchRoutes = require('./routes/batches');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Connect to MongoDB ───────────────────────────────────
connectDB();

// ── Middleware ────────────────────────────────────────────
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" })); // Allow serving assets cross origin safely

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sanitize data against NoSQL injection
app.use(mongoSanitize());

// Sanitize data against XSS
app.use(xss());

// Prevent HTTP param pollution
app.use(hpp());

// ── Static Files (uploaded images) ───────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── API Routes ───────────────────────────────────────────
app.use('/auth', authRoutes);
app.use('/batches', batchRoutes);

// ── Health Check ─────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Taumoeba Filter API',
    timestamp: new Date().toISOString(),
  });
});

// ── Global Error Handler ─────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

// ── Start Server ─────────────────────────────────────────
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n🚀 Taumoeba Filter API running on http://localhost:${PORT}`);
    console.log(`📋 Health check:  http://localhost:${PORT}/health`);
    console.log(`🔐 Auth routes:   /auth/register, /auth/login`);
    console.log(`📦 Batch routes:  /batches\n`);
  });
}

module.exports = app;
