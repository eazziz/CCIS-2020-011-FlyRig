#!/usr/bin/env bash
# One-time setup for the IU ISE FlyRig team, on a Mac.
# Run this once after cloning this repo: ./setup.sh
set -e

if [[ "$(uname)" != "Darwin" ]]; then
  echo "This script is written for macOS. Ask for help setting up on another OS."
  exit 1
fi

if ! command -v brew >/dev/null 2>&1; then
  echo "Homebrew is required first. Install it from https://brew.sh, then run this script again."
  exit 1
fi

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "Installing ffmpeg..."
  brew install ffmpeg
fi

if ! command -v conda >/dev/null 2>&1; then
  echo "Conda is required first. Install Miniconda from https://docs.conda.io/en/latest/miniconda.html, then run this script again."
  exit 1
fi

source "$(conda info --base)/etc/profile.d/conda.sh"

if ! conda env list | grep -q "^flyrig "; then
  echo "Creating the 'flyrig' conda environment (Node 18, Python 3.11)..."
  conda create -y -n flyrig -c conda-forge nodejs=18 python=3.11
fi

conda activate flyrig

echo "Installing app dependencies..."
npm install

DATA_REPO="$HOME/IU-ISE-FlyRig-Files"
if [ ! -d "$DATA_REPO" ]; then
  echo "Cloning the data repo to $DATA_REPO..."
  git clone https://github.com/eazziz/IU-ISE-FlyRig-Files.git "$DATA_REPO"
else
  echo "Data repo already present at $DATA_REPO"
fi

echo ""
echo "Setup complete. Each time you want to run the app:"
echo "  conda activate flyrig"
echo "  npm start"
