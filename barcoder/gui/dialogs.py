from PyQt5.QtWidgets import QDialog, QFormLayout, QLineEdit, QDialogButtonBox, QIntValidator

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
