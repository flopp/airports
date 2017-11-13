from flask import Flask
import www.airports
import www.data

app = Flask(__name__)
app.config.from_object('config')

try:
    from flask_compress import Compress

    Compress(app)
except ImportError:
    pass

app.data = data.Data()
