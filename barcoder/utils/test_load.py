"""
Test script to check if pyzbar can be loaded properly
"""
import os
import sys
import ctypes

def main():
    print("Testing ZBar library loading...")

    # Check platform
    print(f"Platform: {sys.platform}")

    # Check environment variables
    library_paths = {
        'DYLD_LIBRARY_PATH': os.environ.get('DYLD_LIBRARY_PATH', ''),
        'LD_LIBRARY_PATH': os.environ.get('LD_LIBRARY_PATH', ''),
        'DYLD_FALLBACK_LIBRARY_PATH': os.environ.get('DYLD_FALLBACK_LIBRARY_PATH', '')
    }

    print("Library environment variables:")
    for name, value in library_paths.items():
        print(f"  {name}: {value}")

    # Manually load ZBar library
    if sys.platform == 'darwin':
        zbar_path = '/opt/homebrew/lib/libzbar.dylib'
        if os.path.exists(zbar_path):
            print(f"Found ZBar library at {zbar_path}")
            try:
                lib = ctypes.cdll.LoadLibrary(zbar_path)
                print("Successfully loaded ZBar library directly")

                # Set environment variables
                os.environ['DYLD_LIBRARY_PATH'] = '/opt/homebrew/lib:' + os.environ.get('DYLD_LIBRARY_PATH', '')
                os.environ['LD_LIBRARY_PATH'] = '/opt/homebrew/lib:' + os.environ.get('LD_LIBRARY_PATH', '')
                os.environ['DYLD_FALLBACK_LIBRARY_PATH'] = '/opt/homebrew/lib:' + os.environ.get('DYLD_FALLBACK_LIBRARY_PATH', '')

                print("Updated environment variables")
            except Exception as e:
                print(f"Failed to load library: {e}")
        else:
            print(f"ZBar library not found at {zbar_path}")

    # Try to import pyzbar
    print("\nAttempting to import pyzbar...")
    try:
        from pyzbar import pyzbar
        print("Successfully imported pyzbar")

        # Try to use it
        print("\nTesting pyzbar functionality...")

        # Try to access some attributes or functions
        print(f"Available attributes/functions in pyzbar:")
        for attr in dir(pyzbar):
            if not attr.startswith('_'):
                print(f"  - {attr}")

        # Check if decode function exists (the main function we'll use)
        if hasattr(pyzbar, 'decode'):
            print("\nFound decode function in pyzbar - this is good!")
            return True
        else:
            print("\nCould not find decode function in pyzbar - this is a problem!")
            return False

    except ImportError as e:
        print(f"Failed to import pyzbar: {e}")
        return False

if __name__ == "__main__":
    success = main()
    print(f"\nOverall test {'PASSED' if success else 'FAILED'}")
    sys.exit(0 if success else 1)
