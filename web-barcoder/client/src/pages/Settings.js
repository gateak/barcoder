import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const Settings = () => {
  const [settings, setSettings] = useState({
    drive_folder_name: 'BarcoderImages',
    sync_interval: 60,
    local_folder: 'images'
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [driveStatus, setDriveStatus] = useState('Not authenticated');

  useEffect(() => {
    fetchSettings();
    checkDriveAuth();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/settings');

      if (response.data.success) {
        setSettings(response.data.settings);
      } else {
        toast.warning('Using default settings');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Error loading settings');
    } finally {
      setLoading(false);
    }
  };

  const checkDriveAuth = async () => {
    try {
      const response = await axios.get('/api/drive/status');

      if (response.data.authenticated) {
        setDriveStatus('Authenticated');
      } else {
        setDriveStatus('Not authenticated');
      }
    } catch (error) {
      console.error('Error checking drive status:', error);
      setDriveStatus('Error checking authentication');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings({
      ...settings,
      [name]: name === 'sync_interval' ? parseInt(value, 10) || 0 : value
    });
  };

  const saveSettings = async (e) => {
    e.preventDefault();

    // Validate
    if (settings.sync_interval < 30) {
      toast.warning('Sync interval should be at least 30 seconds');
      return;
    }

    try {
      setSaving(true);
      const response = await axios.post('/api/settings', settings);

      if (response.data.success) {
        toast.success('Settings saved successfully');
      } else {
        throw new Error(response.data.message || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const authenticateDrive = async () => {
    try {
      const response = await axios.get('/api/drive/auth');

      if (response.data.url) {
        // Open the authentication URL in a new window
        window.open(response.data.url, '_blank');
        toast.info('Please complete authentication in the opened window');
      } else if (response.data.success) {
        toast.success('Already authenticated with Google Drive');
        setDriveStatus('Authenticated');
      } else {
        throw new Error('Failed to start authentication process');
      }
    } catch (error) {
      console.error('Error in Drive authentication:', error);
      toast.error(`Authentication error: ${error.message}`);
    }
  };

  if (loading) {
    return <div className="loading">Loading settings...</div>;
  }

  return (
    <div className="settings-page">
      <h2>Drive Settings</h2>

      <div className="drive-auth-status">
        <p>Google Drive Status: <strong>{driveStatus}</strong></p>
        <button
          className="btn btn-primary"
          onClick={authenticateDrive}
        >
          {driveStatus === 'Authenticated' ? 'Re-authenticate' : 'Authenticate with Google Drive'}
        </button>
      </div>

      <form className="settings-form" onSubmit={saveSettings}>
        <div className="form-group">
          <label htmlFor="drive_folder_name">Drive Folder Name:</label>
          <input
            type="text"
            id="drive_folder_name"
            name="drive_folder_name"
            className="form-control"
            value={settings.drive_folder_name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="local_folder">Local Folder:</label>
          <input
            type="text"
            id="local_folder"
            name="local_folder"
            className="form-control"
            value={settings.local_folder}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="sync_interval">Sync Interval (seconds):</label>
          <input
            type="number"
            id="sync_interval"
            name="sync_interval"
            className="form-control"
            min="30"
            max="3600"
            value={settings.sync_interval}
            onChange={handleChange}
            required
          />
          <small>Minimum 30 seconds, maximum 1 hour</small>
        </div>

        <button
          type="submit"
          className="btn btn-success"
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>

      <div className="settings-info">
        <h3>Google Drive Setup Instructions</h3>
        <ol>
          <li>Create a Google Cloud Platform project: <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer">https://console.cloud.google.com/</a></li>
          <li>Enable the Google Drive API</li>
          <li>Create OAuth 2.0 credentials (Web application)</li>
          <li>Add <code>http://localhost:5000/api/drive/callback</code> as an authorized redirect URI</li>
          <li>Download the credentials as JSON</li>
          <li>Rename the downloaded file to <code>client_secrets.json</code> and place it in the <code>config</code> directory of the application</li>
          <li>Click the "Authenticate with Google Drive" button above</li>
        </ol>
      </div>
    </div>
  );
};

export default Settings;
