import cv2
import base64
import os
import sys
import ctypes
import json
from pathlib import Path
from drive_sync import GoogleDriveSync

# Try to load ZBar library manually
try:
    # For macOS
    if sys.platform == 'darwin':
        zbar_path = '/opt/homebrew/lib/libzbar.dylib'
        if os.path.exists(zbar_path):
            ctypes.cdll.LoadLibrary(zbar_path)
            os.environ['DYLD_LIBRARY_PATH'] = '/opt/homebrew/lib'
    # For Windows
    elif sys.platform == 'win32':
        for dir_path in [
            os.path.join(os.environ.get('ProgramFiles', ''), 'ZBar', 'bin'),
            os.path.join(os.environ.get('ProgramFiles(x86)', ''), 'ZBar', 'bin')
        ]:
            zbar_path = os.path.join(dir_path, 'libzbar-0.dll')
            if os.path.exists(zbar_path):
                ctypes.cdll.LoadLibrary(zbar_path)
                break
except Exception as e:
    print(f"Warning: Failed to manually load ZBar library: {e}")
    print("Continuing with pyzbar's default loading mechanism...")

from PyQt5.QtWidgets import QApplication, QMainWindow, QLabel, QPushButton, QVBoxLayout, QWidget, QMessageBox
from PyQt5.QtWidgets import QInputDialog, QLineEdit, QDialog, QFormLayout, QDialogButtonBox, QIntValidator
from PyQt5.QtCore import Qt, QTimer
from PyQt5.QtGui import QImage, QPixmap, QKeyEvent
from pyzbar.pyzbar import decode

class DriveSettingsDialog(QDialog):
    def __init__(self, parent=None, current_folder="BarcoderImages", current_sync_interval=60, current_local_folder="images"):
        super().__init__(parent)
        self.setWindowTitle("Google Drive Settings")
        self.setMinimumWidth(400)

        # Create form layout
        layout = QFormLayout(self)

        # Folder name input
        self.folder_name = QLineEdit(current_folder)
        layout.addRow("Drive Folder Name:", self.folder_name)

        # Local folder input
        self.local_folder = QLineEdit(current_local_folder)
        layout.addRow("Local Folder:", self.local_folder)

        # Sync interval input
        self.sync_interval = QLineEdit(str(current_sync_interval))
        self.sync_interval.setValidator(QIntValidator(30, 3600))  # Between 30 seconds and 1 hour
        layout.addRow("Sync Interval (seconds):", self.sync_interval)

        # Add buttons
        button_box = QDialogButtonBox(QDialogButtonBox.Ok | QDialogButtonBox.Cancel)
        button_box.accepted.connect(self.accept)
        button_box.rejected.connect(self.reject)
        layout.addRow(button_box)

class BarcodeCameraApp(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Barcode Scanner and Image Capture")
        self.setGeometry(100, 100, 700, 600)

        # Initialize variables
        self.cap = cv2.VideoCapture(0)  # Use default camera (0)
        self.current_barcode = None
        self.current_frame = None

        # Load settings if available
        settings = self.load_settings()

        # Drive sync settings
        self.drive_folder_name = settings.get("drive_folder_name", "BarcoderImages")
        sync_interval = settings.get("sync_interval", 60)
        local_folder = settings.get("local_folder", "images")

        # Initialize Google Drive sync
        self.drive_sync = GoogleDriveSync(
            folder_path=local_folder,
            sync_interval=sync_interval,
            drive_folder_name=self.drive_folder_name
        )

        # Create central widget and layout
        central_widget = QWidget()
        self.setCentralWidget(central_widget)
        layout = QVBoxLayout(central_widget)

        # Create UI elements
        self.image_label = QLabel()
        self.image_label.setMinimumSize(640, 480)
        self.image_label.setAlignment(Qt.AlignCenter)

        self.status_label = QLabel("Status: Waiting for barcode...")
        self.barcode_label = QLabel("Barcode: None")

        self.capture_button = QPushButton("Capture Image")
        self.capture_button.setEnabled(False)
        self.capture_button.clicked.connect(self.capture_image)

        self.sync_button = QPushButton("Sync to Google Drive")
        self.sync_button.clicked.connect(self.sync_to_drive)

        self.settings_button = QPushButton("Drive Settings")
        self.settings_button.clicked.connect(self.show_drive_settings)

        # Create keyboard shortcut info label
        self.shortcut_label = QLabel("Press SPACEBAR to capture image")
        self.shortcut_label.setStyleSheet("color: blue;")

        # Add widgets to layout
        layout.addWidget(self.image_label)
        layout.addWidget(self.status_label)
        layout.addWidget(self.barcode_label)
        layout.addWidget(self.shortcut_label)
        layout.addWidget(self.capture_button)
        layout.addWidget(self.sync_button)
        layout.addWidget(self.settings_button)

        # Setup timer for video feed
        self.timer = QTimer()
        self.timer.timeout.connect(self.update_frame)
        self.timer.start(10)  # Update every 10ms

        # Start background sync
        self.drive_sync.start_sync_thread()

        # Enable key event capture
        self.setFocusPolicy(Qt.StrongFocus)

    def update_frame(self):
        ret, frame = self.cap.read()
        if ret:
            self.current_frame = frame.copy()

            # Try to detect barcode
            barcodes = decode(frame)
            if barcodes:
                # Found a barcode
                for barcode in barcodes:
                    barcode_data = barcode.data.decode('utf-8')

                    # Draw rectangle around barcode
                    (x, y, w, h) = barcode.rect
                    cv2.rectangle(frame, (x, y), (x + w, y + h), (0, 255, 0), 2)

                    # Update barcode data if changed
                    if self.current_barcode != barcode_data:
                        self.current_barcode = barcode_data

                        # Convert to base64
                        encoded_barcode = base64.b64encode(barcode_data.encode()).decode()
                        self.status_label.setText("Status: Barcode detected!")
                        self.barcode_label.setText(f"Barcode: {barcode_data} (Base64: {encoded_barcode})")

                        # Enable capture button
                        self.capture_button.setEnabled(True)

            # Convert frame for display
            height, width, channel = frame.shape
            bytes_per_line = 3 * width
            q_image = QImage(frame.data, width, height, bytes_per_line, QImage.Format_RGB888).rgbSwapped()
            self.image_label.setPixmap(QPixmap.fromImage(q_image).scaled(
                self.image_label.width(), self.image_label.height(),
                Qt.KeepAspectRatio, Qt.SmoothTransformation))

    def capture_image(self):
        if self.current_frame is not None and self.current_barcode is not None:
            # Make safe filename (remove invalid characters)
            safe_filename = self.current_barcode.replace('/', '_').replace('\\', '_').replace(':', '_')

            # Create images directory if it doesn't exist
            images_dir = "images"
            os.makedirs(images_dir, exist_ok=True)

            # Save image
            output_filename = os.path.join(images_dir, f"{safe_filename}.jpg")
            cv2.imwrite(output_filename, self.current_frame)

            QMessageBox.information(self, "Image Captured", f"Image saved as: {output_filename}")

    def sync_to_drive(self):
        """Manually trigger Google Drive sync"""
        try:
            self.status_label.setText("Status: Syncing to Google Drive...")
            if not self.drive_sync.authenticated:
                if self.drive_sync.authenticate():
                    self.drive_sync.sync_folder()
                    self.status_label.setText("Status: Sync completed")
                else:
                    self.status_label.setText("Status: Google Drive authentication failed")
            else:
                self.drive_sync.sync_folder()
                self.status_label.setText("Status: Sync completed")
        except Exception as e:
            self.status_label.setText(f"Status: Sync error - {str(e)}")

    def show_drive_settings(self):
        """Display dialog to configure Google Drive settings"""
        dialog = DriveSettingsDialog(self, self.drive_folder_name, self.drive_sync.sync_interval, self.drive_sync.folder_path)
        if dialog.exec_():
            new_folder = dialog.folder_name.text().strip()
            if new_folder and new_folder != self.drive_folder_name:
                self.drive_folder_name = new_folder

            # Stop current sync
            self.drive_sync.stop_sync_thread()

            # Restart with new settings
            self.drive_sync = GoogleDriveSync(
                folder_path=self.drive_sync.folder_path,
                sync_interval=self.drive_sync.sync_interval,
                drive_folder_name=self.drive_folder_name
            )
            self.drive_sync.start_sync_thread()

            # Save updated settings
            self.save_settings()

            self.status_label.setText(f"Status: Drive folder set to '{self.drive_folder_name}'")

    def closeEvent(self, event):
        # Save settings before closing
        self.save_settings()

        # Stop sync thread
        self.drive_sync.stop_sync_thread()

        # Release camera on exit
        if self.cap.isOpened():
            self.cap.release()
        event.accept()

    def keyPressEvent(self, event: QKeyEvent):
        """Handle key press events"""
        # Capture image when spacebar is pressed and a barcode is detected
        if event.key() == Qt.Key_Space and self.current_barcode is not None:
            self.capture_image()
        # Pass any other key events to the parent class
        else:
            super().keyPressEvent(event)

    def load_settings(self):
        """Load settings from settings.json if it exists"""
        settings_file = "settings.json"
        settings = {}

        if os.path.exists(settings_file):
            try:
                with open(settings_file, 'r') as f:
                    settings = json.load(f)
                print(f"Loaded settings from {settings_file}")
            except Exception as e:
                print(f"Error loading settings: {e}")

        return settings

    def save_settings(self):
        """Save current settings to settings.json"""
        settings = {
            "drive_folder_name": self.drive_folder_name,
            "sync_interval": self.drive_sync.sync_interval,
            "local_folder": self.drive_sync.folder_path
        }

        try:
            with open("settings.json", 'w') as f:
                json.dump(settings, f, indent=2)
        except Exception as e:
            print(f"Error saving settings: {e}")

if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = BarcodeCameraApp()
    window.show()
    sys.exit(app.exec_())
