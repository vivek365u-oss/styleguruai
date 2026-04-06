#!/bin/bash
set -e

echo "Installing Python dependencies..."
pip install --upgrade pip
cd Backend
pip install -r requirements.txt
cd ..

echo "Build complete!"
