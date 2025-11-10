#!/bin/bash

echo "Checking Python version..."
python3 --version

echo "Checking for Python 3.10..."
if ! python3.10 --version &>/dev/null; then
    echo "Python 3.10 is not installed. Please install it before proceeding."
    echo "You can use Homebrew: brew install python@3.10"
    exit 1
fi

echo "Creating virtual environment with Python 3.10..."
python3.10 -m venv venv

echo "Activating virtual environment..."
source venv/bin/activate

echo "Upgrading pip..."
pip install --upgrade pip

echo "Installing dependencies..."
pip install -r requirements.txt

echo "Running app.py..."
python app.py
