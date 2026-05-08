const express = require('express');
const router = express.Router();
const {
  getAllImages,
  getImageById,
  getLatestImage,
  deleteImage,
  getStats,
} = require('../controllers/cameraController');

// GET /api/cameras/stats  — must be before /:id to avoid conflict
router.get('/stats', getStats);

// GET /api/cameras/latest
router.get('/latest', getLatestImage);

// GET /api/cameras?page=1&limit=10&guid=CAM-P016
router.get('/', getAllImages);

// GET /api/cameras/:id
router.get('/:id', getImageById);

// DELETE /api/cameras/:id
router.delete('/:id', deleteImage);

module.exports = router;
