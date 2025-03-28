#!/bin/bash

# Set the path to the ZBar library
export DYLD_LIBRARY_PATH=/opt/homebrew/lib:$DYLD_LIBRARY_PATH

# Run the application
# Option 1: Use the run.py script
python run.py

# Option 2: Run as module (uncomment below)
# python -m barcoder
