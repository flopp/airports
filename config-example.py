import os

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
DEBUG = True

BASE_URL = '''YOUR_BASE_URL'''
GOOGLE_MAPS_KEY = '''YOUR_GOOGLE_API_KEY'''

META = '''<!-- some tags for the header (e.g. host validation hashes) -->'''

BOTTOM = '''<!-- some html to put at the bottom (e.g. tracking) -->'''

try:
    from config_local import *
except ImportError:
    pass
