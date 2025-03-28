#!/bin/bash

# Set the path to the ZBar library
export DYLD_LIBRARY_PATH=/opt/homebrew/lib:$DYLD_LIBRARY_PATH

# Run the application
python barcoder.py
