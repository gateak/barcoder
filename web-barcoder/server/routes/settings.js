const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Path to the settings file
const settingsPath = path.join(__dirname, '../../config/settings.json');

// Get current settings
router.get('/', (req, res) => {
  try {
    // Check if settings file exists
    if (!fs.existsSync(settingsPath)) {
      // Create default settings
      const defaultSettings = {
        drive_folder_name: 'BarcoderImages',
        sync_interval: 60,
        local_folder: 'images'
      };

      // Save default settings
      fs.writeFileSync(settingsPath, JSON.stringify(defaultSettings, null, 2));

      return res.json({
        success: true,
        settings: defaultSettings,
        default: true
      });
    }

    // Read and parse settings file
    const settingsFile = fs.readFileSync(settingsPath, 'utf8');
    const settings = JSON.parse(settingsFile);

    res.json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Error getting settings:', error);
    res.status(500).json({
      success: false,
      message: `Error getting settings: ${error.message}`
    });
  }
});

// Update settings
router.post('/', (req, res) => {
  try {
    const newSettings = req.body;

    // Validate required fields
    if (!newSettings.drive_folder_name || !newSettings.local_folder) {
      return res.status(400).json({
        success: false,
        message: 'Missing required settings fields'
      });
    }

    // Validate sync interval (minimum 30 seconds)
    if (newSettings.sync_interval < 30) {
      return res.status(400).json({
        success: false,
        message: 'Sync interval must be at least 30 seconds'
      });
    }

    // Ensure the local folder exists
    const localFolderPath = path.join(__dirname, '../../', newSettings.local_folder);
    if (!fs.existsSync(localFolderPath)) {
      fs.mkdirSync(localFolderPath, { recursive: true });
    }

    // Save settings
    fs.writeFileSync(settingsPath, JSON.stringify(newSettings, null, 2));

    // If we have an active sync process, we should restart it with new settings
    // This would be handled by a drive sync controller in a real app

    res.json({
      success: true,
      message: 'Settings updated successfully',
      settings: newSettings
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({
      success: false,
      message: `Error updating settings: ${error.message}`
    });
  }
});

module.exports = router;
