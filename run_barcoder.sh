#!/bin/bash

# Set the path to the ZBar library
export DYLD_LIBRARY_PATH=/opt/homebrew/lib:$DYLD_LIBRARY_PATH
export LD_LIBRARY_PATH=/opt/homebrew/lib:$LD_LIBRARY_PATH

# Make sure Python can find the ZBar library
export PYTHONPATH=${PYTHONPATH:+$PYTHONPATH:}$(pwd)

# Run the application
# Option 1: Use the run.py script
python run.py

# Option 2: Run as module (uncomment below)
# python -m barcoder
