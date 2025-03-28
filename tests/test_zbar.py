import sys
from barcoder.utils.zbar_finder import find_zbar_library

if __name__ == "__main__":
    result = find_zbar_library()
    if result:
        print(f"\nZBar library found at: {result}")
        print("Library loaded successfully.")
        sys.exit(0)
    else:
        print("\nFailed to find or load ZBar library.")
        print("Please install ZBar and ensure it's in your library path.")
        sys.exit(1)
