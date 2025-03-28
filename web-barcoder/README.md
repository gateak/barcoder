# Web Barcoder - Barcode Scanner Web Application

A web-based version of the original barcode scanner desktop application. This application uses your device's camera to scan barcodes, capture images, and sync them to Google Drive.

## Features

- Real-time barcode detection and decoding
- Base64 encoding of barcode values
- Image capture with a click of a button or spacebar
- Automatic file naming using the barcode value
- Visual feedback with highlighted barcodes
- Automatic synchronization with Google Drive
- Gallery view of all captured images
- Settings page to configure Drive synchronization

## Technologies Used

- **Frontend:** React.js, HTML5 QR Code scanner
- **Backend:** Node.js, Express
- **Google Drive Integration:** Google Drive API v3
- **Camera Access:** WebRTC via HTML5 QR Code library

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- A webcam or camera connected to your device
- A Google Cloud Platform account (for Drive integration)

## Installation

1. Clone this repository or download the files:
   ```
   git clone <repository-url>
   cd web-barcoder
   ```

2. Install dependencies for both server and client:
   ```
   npm run install-all
   ```

## Setting up Google Drive Integration

1. Create a Google Cloud Platform project: https://console.cloud.google.com/
2. Enable the Google Drive API
3. Create OAuth 2.0 credentials:
   - Select "Web application" as the application type
   - Add `http://localhost:5000/api/drive/callback` as an authorized redirect URI
4. Download the credentials as JSON
5. Rename the downloaded file to `client_secrets.json` and place it in the `config` directory of the application

## Running the Application

1. Start the application in development mode:
   ```
   npm run dev
   ```

   This will start both the backend server (on port 5000) and the React development server (on port 3000).

2. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

3. For production use, build the client and run only the server:
   ```
   npm run build
   npm start
   ```

   In production mode, the server will serve the built React app at `http://localhost:5000`

## Usage

1. On the Scanner page, allow camera access when prompted
2. Point your camera at a barcode
3. Once the barcode is detected, you can:
   - Click the "Capture Image" button, OR
   - Press the SPACEBAR key to capture the image
4. The image will be saved with the barcode value as the filename
5. Images will automatically sync to Google Drive based on your settings
6. You can also manually trigger a sync by clicking the "Sync to Google Drive" button
7. View captured images in the Gallery page
8. Configure Google Drive settings in the Settings page

## Folder Structure

```
web-barcoder/
├── client/               # React frontend
│   ├── public/           # Static files
│   └── src/              # React source code
│       ├── components/   # Reusable components
│       └── pages/        # Page components
├── server/               # Express backend
│   ├── routes/           # API routes
│   └── index.js          # Server entry point
├── config/               # Configuration files
│   └── settings.json     # App settings
├── images/               # Captured images
└── package.json          # Project dependencies and scripts
```

## Troubleshooting

### Camera Access Issues

- Make sure your browser has permission to access the camera
- For best results, use Google Chrome or a Chromium-based browser
- If using HTTPS, ensure your certificate is valid

### Google Drive Authentication Issues

1. **Authentication fails:** Try these steps:
   - Check that your client_secrets.json file is correctly formatted and valid
   - Ensure the redirect URI in your Google Cloud Console matches exactly with the one in the application
   - Try clearing your browser cookies and cache

2. **Access token errors:** The application should automatically refresh tokens, but if you experience issues:
   - Delete the token.json file in the config directory
   - Re-authenticate through the Settings page

## License

MIT
