const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Get all images
router.get('/', (req, res) => {
  try {
    const imagesDir = path.join(__dirname, '../../images');

    // Check if directory exists
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
      return res.json({ success: true, images: [] });
    }

    // Read directory
    const files = fs.readdirSync(imagesDir);

    // Filter for just jpg files
    const imageFiles = files.filter(file =>
      file.toLowerCase().endsWith('.jpg') ||
      file.toLowerCase().endsWith('.jpeg')
    );

    // Create array of image objects with metadata
    const images = imageFiles.map(filename => {
      // Extract barcode from filename (remove extension)
      const barcode = filename.replace(/\.[^/.]+$/, "");

      // Get file stats
      const stats = fs.statSync(path.join(imagesDir, filename));

      return {
        filename,
        barcode,
        created: stats.ctime,
        size: stats.size
      };
    });

    // Sort by creation time, newest first
    images.sort((a, b) => new Date(b.created) - new Date(a.created));

    res.json({ success: true, images });
  } catch (error) {
    console.error('Error getting images:', error);
    res.status(500).json({
      success: false,
      message: `Error getting images: ${error.message}`
    });
  }
});

// Get a specific image by filename
router.get('/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const imagePath = path.join(__dirname, '../../images', filename);

    // Check if file exists
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    // Send the file
    res.sendFile(imagePath);
  } catch (error) {
    console.error('Error getting image:', error);
    res.status(500).json({
      success: false,
      message: `Error getting image: ${error.message}`
    });
  }
});

// Delete an image
router.delete('/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const imagePath = path.join(__dirname, '../../images', filename);

    // Check if file exists
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    // Delete the file
    fs.unlinkSync(imagePath);

    res.json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({
      success: false,
      message: `Error deleting image: ${error.message}`
    });
  }
});

module.exports = router;
