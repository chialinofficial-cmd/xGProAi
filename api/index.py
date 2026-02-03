import sys
import os

# Add the backend directory to sys.path so imports like "import models" work in main.py
sys.path.append(os.path.join(os.path.dirname(__file__), '../backend'))

from main import app
