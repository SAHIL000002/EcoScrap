const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const mongoose = require('mongoose');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const materialLotRoutes = require('./routes/materialLot.routes');
const priceRoutes = require('./routes/price.routes');
const recyclerRoutes = require('./routes/recycler.routes');
const transactionRoutes = require('./routes/transaction.routes');
const quoteRoutes = require('./routes/quote.routes');
const traceabilityRoutes = require('./routes/traceability.routes');
const safetyRoutes = require('./routes/safety.routes');

const errorHandler = require('./middleware/error.middleware');
const notFound = require('./middleware/notFound.middleware');
const ApiResponse = require('./utils/apiResponse');

const app = express();

// Render / Railway terminate TLS and forward the client IP in X-Forwarded-For.
// Trusting one proxy hop is required for express-rate-limit to key on the real
// device IP instead of the shared proxy IP (which would rate-limit every
// collector together).
app.set('trust proxy', 1);

// Security HTTP headers
app.use(helmet());

// CORS config
app.use(cors());

// HTTP request logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Rate limiting (100 requests per 15 minutes per IP)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    errors: ['Rate limit exceeded']
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api', limiter);

// Request body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve local static uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health Check API (Section 33)
app.get('/api/v1/health', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  return res.status(200).json({
    success: true,
    message: 'EcoScrap API is running',
    database: dbStatus,
    timestamp: new Date().toISOString()
  });
});

// Mount V1 API Routes (Section 14)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/lots', materialLotRoutes);
app.use('/api/v1/prices', priceRoutes);
app.use('/api/v1/recyclers', recyclerRoutes);
app.use('/api/v1/transactions', transactionRoutes);
app.use('/api/v1/quotes', quoteRoutes);
app.use('/api/v1/traceability', traceabilityRoutes);
app.use('/api/v1/safety', safetyRoutes);

// 404 Route Handler
app.use(notFound);

// Centralized Error Handler
app.use(errorHandler);

module.exports = app;
