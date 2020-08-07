import os
import typing

import appdirs  # type: ignore
from flask import Flask, jsonify, make_response, render_template, redirect, request, url_for
from werkzeug.wrappers import Response

from airports.db import DB

flask_app = Flask(__name__)
db = DB()


def configure(config_file_name: str, reset_cache: bool) -> None:
    flask_app.config.from_pyfile(os.path.abspath(config_file_name))

    if "CACHE_DIR" in flask_app.config:
        db.load(flask_app.config["CACHE_DIR"], reset_cache)
    else:
        cache_dir = os.path.join(appdirs.user_cache_dir("flopp.airports"))
        db.load(cache_dir, reset_cache)


@flask_app.route("/")
def index() -> str:
    return render_template(
        "index.html",
        airport=db.get_random().to_dict(True),
        airports=[airport.to_dict(False) for airport in db.get_random_list(10)],
    )


@flask_app.route("/a/BASE_URL/a/<code>")
def show_airport_bad(code: str) -> Response:
    return redirect(url_for("show_airport", code=code))


@flask_app.route("/a/<code>")
def show_airport(code: str) -> str:
    airport = db.get(code)
    if airport is None:
        airport = db.get_random()
    return render_template(
        "index.html",
        airport=airport.to_dict(True),
        airports=[airport.to_dict(False) for airport in db.get_random_list(10)],
    )


@flask_app.route("/api/random")
def api_random() -> str:
    return jsonify(airport=db.get_random().to_dict(True))


@flask_app.route("/api/get/<code>")
def api_get(code: str) -> str:
    airport = db.get(code)
    if airport:
        return jsonify(airport=airport.to_dict(True))
    return jsonify(error=f'Cannot find airport "{code}"')


@flask_app.route("/api/search", methods=["POST"])
def search() -> str:
    query = request.form["q"]
    airport = db.search(query)
    if airport:
        return jsonify(airport=airport.to_dict(True))
    return jsonify(error=f'Cannot find an airport matching "{query}"')


@flask_app.route("/sitemap.txt")
def sitemap() -> str:
    return render_template("sitemap.txt", icaos=db.get_all_icaos())


@flask_app.route("/robots.txt")
def robots() -> str:
    return render_template("robots.txt")
