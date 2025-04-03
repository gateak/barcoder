import sys
import os

# First, load ZBar library before importing other modules
from barcoder.utils.zbar_finder import load_zbar_library
load_zbar_library()

# Now import other modules that depend on ZBar
from PyQt5.QtWidgets import QApplication
from barcoder.gui.app import BarcodeCameraApp

def run_application():
    """Run the barcode scanner application"""
    # Create Qt application
    app = QApplication(sys.argv)

    # Create and show main window
    window = BarcodeCameraApp()
    window.show()

    # Start the application event loop
    sys.exit(app.exec_())

if __name__ == "__main__":
    run_application()
