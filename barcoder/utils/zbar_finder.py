import os
import ctypes
import platform
import sys

def find_zbar_library():
    """Find the zbar shared library."""
    system = platform.system()

    # Print debug info
    print(f"System: {system}")
    print(f"Platform: {platform.platform()}")

    # Common library names
    if system == 'Windows':
        lib_names = ['libzbar-0.dll', 'zbar.dll']
    elif system == 'Darwin':  # macOS
        lib_names = ['libzbar.dylib', 'libzbar.0.dylib']
    else:  # Linux and others
        lib_names = ['libzbar.so', 'libzbar.so.0']

    # Common library locations
    paths = []

    # Add environment variable paths
    for env_var in ['DYLD_LIBRARY_PATH', 'LD_LIBRARY_PATH', 'PATH']:
        if env_var in os.environ:
            for path in os.environ[env_var].split(os.pathsep):
                paths.append(path)

    # Add common library locations
    if system == 'Darwin':  # macOS
        paths.extend([
            '/opt/homebrew/lib',
            '/usr/local/lib',
            '/usr/lib',
        ])
    elif system == 'Windows':
        paths.extend([
            os.path.join(os.environ.get('ProgramFiles', ''), 'ZBar', 'bin'),
            os.path.join(os.environ.get('ProgramFiles(x86)', ''), 'ZBar', 'bin'),
        ])
    else:  # Linux and others
        paths.extend([
            '/usr/local/lib',
            '/usr/lib',
            '/usr/lib/x86_64-linux-gnu',
        ])

    # Deduplicate paths
    paths = list(dict.fromkeys(paths))

    # Print paths being searched
    print("Searching for zbar library in:")
    for path in paths:
        print(f"  - {path}")

    # Try to load the library
    for path in paths:
        for lib_name in lib_names:
            lib_path = os.path.join(path, lib_name)
            if os.path.exists(lib_path):
                print(f"Found library at: {lib_path}")
                try:
                    lib = ctypes.cdll.LoadLibrary(lib_path)
                    print(f"Successfully loaded: {lib_path}")
                    return lib_path
                except Exception as e:
                    print(f"Failed to load {lib_path}: {e}")

    return None

def load_zbar_library():
    """Load the ZBar library for use with pyzbar."""
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
