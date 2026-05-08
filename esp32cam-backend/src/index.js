require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const connectDB = require('./config/database');
const cameraRoutes = require('./routes/cameraRoutes');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Connect to MongoDB ────────────────────────────────────────────────────────
connectDB();

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors('*'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(morgan('dev'));

// ─── Health Check ──────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'ESP32-CAM Backend API is running 🚀',
    version: '1.0.0',
    endpoints: {
      cameras: '/api/cameras',
      latest: '/api/cameras/latest',
      stats: '/api/cameras/stats',
    },
  });
});

// ─── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/cameras', cameraRoutes);

// ─── Error Handling ────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ─── Start Server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   ESP32-CAM Backend - IF-6403 SCA            ║');
  console.log(`║   Server running on port ${PORT}               ║`);
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');
  console.log(`📡 API ready at http://localhost:${PORT}/api/cameras`);
});
