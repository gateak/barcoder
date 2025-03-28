const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const fileUpload = require('express-fileupload');

// Import routes
const imageRoutes = require('./routes/images');
const settingsRoutes = require('./routes/settings');
const driveRoutes = require('./routes/drive');

// Create Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(fileUpload());

// Ensure the images directory exists
const imagesDir = path.join(__dirname, '..', 'images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir, { recursive: true });
}

// Ensure the config directory exists
const configDir = path.join(__dirname, '..', 'config');
if (!fs.existsSync(configDir)) {
  fs.mkdirSync(configDir, { recursive: true });
}

// Create default settings.json if it doesn't exist
const settingsPath = path.join(configDir, 'settings.json');
if (!fs.existsSync(settingsPath)) {
  const defaultSettings = {
    drive_folder_name: 'BarcoderImages',
    sync_interval: 60,
    local_folder: 'images'
  };
  fs.writeFileSync(settingsPath, JSON.stringify(defaultSettings, null, 2));
  console.log('Created default settings.json');
}

// Routes
app.use('/api/images', imageRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/drive', driveRoutes);

// Special route for image capture
app.post('/api/capture', (req, res) => {
  try {
    if (!req.files || !req.files.image) {
      return res.status(400).json({
        success: false,
        message: 'No image uploaded'
      });
    }

    const barcode = req.body.barcode || 'unknown';
    const safeBarcode = barcode.replace(/[/\\:*?"<>|]/g, '_');
    const uploadedImage = req.files.image;
    const filename = req.body.filename || `${safeBarcode}.jpg`;
    const uploadPath = path.join(__dirname, '..', 'images', filename);

    uploadedImage.mv(uploadPath, (err) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: `Error saving image: ${err.message}`
        });
      }

      res.json({
        success: true,
        message: 'Image captured successfully',
        filename
      });
    });
  } catch (error) {
    console.error('Error in capture endpoint:', error);
    res.status(500).json({
      success: false,
      message: `Server error: ${error.message}`
    });
  }
});

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
