#!/bin/bash
set -e

echo "Installing Python dependencies..."
pip install --upgrade pip
cd backend
pip install -r requirements.txt
cd ..

echo "Build complete!"
