const CameraImage = require('../models/CameraImage');

/**
 * GET /api/cameras
 * Fetch all camera images with pagination & optional filter by guid
 */
const getAllImages = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const guid = req.query.guid; // optional filter, e.g. ?guid=CAM-P016

    // Build filter
    const filter = {};
    if (guid) {
      filter.image_name = { $regex: `^${guid}-`, $options: 'i' };
    }

    const [images, total] = await Promise.all([
      CameraImage.find(filter).sort({ created_at: -1 }).skip(skip).limit(limit),
      CameraImage.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      data: images,
      pagination: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('❌ getAllImages error:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * GET /api/cameras/:id
 * Fetch a single camera image by MongoDB _id
 */
const getImageById = async (req, res) => {
  try {
    const image = await CameraImage.findById(req.params.id);
    if (!image) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }
    res.status(200).json({ success: true, data: image });
  } catch (error) {
    console.error('❌ getImageById error:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * GET /api/cameras/latest
 * Fetch the most recently received camera image
 */
const getLatestImage = async (req, res) => {
  try {
    const image = await CameraImage.findOne().sort({ created_at: -1 });
    if (!image) {
      return res.status(404).json({ success: false, message: 'No images found' });
    }
    res.status(200).json({ success: true, data: image });
  } catch (error) {
    console.error('❌ getLatestImage error:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * DELETE /api/cameras/:id
 * Delete a camera image record
 */
const deleteImage = async (req, res) => {
  try {
    const image = await CameraImage.findByIdAndDelete(req.params.id);
    if (!image) {
      return res.status(404).json({ success: false, message: 'Image not found' });
    }
    res.status(200).json({ success: true, message: 'Image deleted successfully' });
  } catch (error) {
    console.error('❌ deleteImage error:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * GET /api/cameras/stats
 * Simple stats: total images, unique cameras, latest capture
 */
const getStats = async (req, res) => {
  try {
    const total = await CameraImage.countDocuments();
    const latest = await CameraImage.findOne().sort({ created_at: -1 }).select('image_name created_at');

    // Distinct GUIDs via aggregation
    const guidAgg = await CameraImage.aggregate([
      {
        $project: {
          guid: {
            $arrayElemAt: [{ $split: ['$image_name', '-'] }, 1],
          },
        },
      },
      { $group: { _id: '$guid' } },
      { $count: 'unique_cameras' },
    ]);

    res.status(200).json({
      success: true,
      data: {
        total_images: total,
        unique_cameras: guidAgg[0]?.unique_cameras || 0,
        latest_capture: latest,
      },
    });
  } catch (error) {
    console.error('❌ getStats error:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  getAllImages,
  getImageById,
  getLatestImage,
  deleteImage,
  getStats,
};
