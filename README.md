# Barcode Scanner and Image Capture Application

A simple Python application that uses your webcam to scan barcodes and capture images with the barcode value as the filename.

## Features

- Real-time barcode detection and decoding
- Base64 encoding of barcode values
- Image capture with a click of a button
- Automatic file naming using the barcode value
- Visual feedback with highlighted barcodes
- Automatic synchronization with Google Drive

## Requirements

- Python 3.6+
- Webcam/Camera
- ZBar library (required by pyzbar for barcode scanning)

## Installation

1. Clone this repository or download the files

2. Install ZBar library:

   On macOS:
   ```
   brew install zbar
   ```

   On Ubuntu/Debian:
   ```
   sudo apt-get install libzbar0
   ```

   On Windows:
   Download prebuilt binaries from https://sourceforge.net/projects/zbar/files/zbar/

3. Install Python dependencies:
   ```
   pip install -r requirements.txt
   ```

   Note: On macOS, you might need to install Qt dependencies separately:
   ```
   brew install qt
   ```

## Usage

1. Run the application:
   ```
   python barcoder.py
   ```

2. Point your camera at a barcode
3. Once the barcode is detected (highlighted in green), you can:
   - Click the "Capture Image" button, OR
   - Press the SPACEBAR key to capture the image
4. The image will be saved in the 'images' directory with the barcode value as the filename
5. Images will automatically sync to Google Drive in the background every minute
6. You can also manually trigger a sync by clicking the "Sync to Google Drive" button
7. To change the Google Drive folder location, click the "Drive Settings" button and enter a new folder name

## Google Drive Setup

To enable Google Drive synchronization:

1. Create a Google Cloud Platform project: https://console.cloud.google.com/
2. Enable the Google Drive API
3. Create OAuth 2.0 credentials (Desktop application)
4. Download the credentials as JSON
5. Rename the downloaded file to `client_secrets.json` and place it in the same directory as the application
6. On first run, you will be prompted to authenticate and grant permissions

For detailed setup instructions, refer to the PyDrive documentation: https://pythonhosted.org/PyDrive/quickstart.html

## Notes

- Supports most common barcode formats (Code128, QR, EAN, etc.)
- For optimal performance, ensure good lighting when scanning barcodes
- The application may require camera permissions
- Uses PyQt5 for the interface, which provides better cross-platform compatibility
- If you encounter "Unable to find zbar shared library" error, make sure to install ZBar as described in the installation section

## Troubleshooting

### Google Drive Authentication Issues

1. **No refresh token error**: If you see an error like `No refresh_token found. Please set access_type of OAuth to offline`, try these steps:
   - Delete the `mycreds.txt` file if it exists
   - Restart the application
   - Follow the authentication prompt in your browser
   - Make sure to grant all requested permissions

2. **Invalid client secrets file**: Make sure your `client_secrets.json` file is correctly formatted and contains valid credentials.

3. **Authentication fails repeatedly**: Sometimes, you may need to:
   - Go to [Google Account Permissions](https://myaccount.google.com/permissions)
   - Revoke access for the application
   - Delete `mycreds.txt`
   - Try authenticating again

If issues persist, you can manually create a `settings.json` file to configure different parameters:

```json
{
  "drive_folder_name": "YourCustomFolderName",
  "sync_interval": 120,
  "local_folder": "custom_images_folder"
}
```
