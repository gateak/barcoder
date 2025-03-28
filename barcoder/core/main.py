import sys
from PyQt5.QtWidgets import QApplication
from barcoder.gui.app import BarcodeCameraApp
from barcoder.utils.zbar_finder import load_zbar_library

def run_application():
    """Run the barcode scanner application"""
    # Load ZBar library
    load_zbar_library()

    # Create Qt application
    app = QApplication(sys.argv)

    # Create and show main window
    window = BarcodeCameraApp()
    window.show()

    # Start the application event loop
    sys.exit(app.exec_())

if __name__ == "__main__":
    run_application()
