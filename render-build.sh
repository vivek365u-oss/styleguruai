#!/bin/bash
set -e

# Update pip
pip install --upgrade pip

# Install dependencies from root requirements.txt (which points to backend/requirements.txt)
pip install -r requirements.txt

echo "Build complete!"
