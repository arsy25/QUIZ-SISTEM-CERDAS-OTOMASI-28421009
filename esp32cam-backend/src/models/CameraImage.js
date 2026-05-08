const mongoose = require('mongoose');

const cameraImageSchema = new mongoose.Schema(
  {
    image_name: {
      type: String,
      required: [true, 'Image name is required'],
      trim: true,
    },
    image_url: {
      type: String,
      required: [true, 'Image URL is required'],
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    // Disable the default _v field
    versionKey: false,
    // Use created_at as the timestamp field (not createdAt/updatedAt)
    timestamps: false,
  }
);

// Index for faster queries
cameraImageSchema.index({ created_at: -1 });
cameraImageSchema.index({ image_name: 1 });

// Virtual: extract GUID (e.g. "CAM-P016") from image name
cameraImageSchema.virtual('guid').get(function () {
  const match = this.image_name.match(/^(CAM-[A-Z0-9]+)-/);
  return match ? match[1] : null;
});

cameraImageSchema.set('toJSON', { virtuals: true });
cameraImageSchema.set('toObject', { virtuals: true });

const CameraImage = mongoose.model('CameraImage', cameraImageSchema);

module.exports = CameraImage;
