from www import app
from flask import render_template, url_for, request, redirect, jsonify


@app.before_first_request
def init():
    app.data.load(app.root_path + '/data/airports.txt')


@app.route('/')
def index():
    return render_template("index.html", airport=app.data.get_random(), airports=app.data.get_random_list(10))


@app.route('/a/BASE_URL/a/<code>')
def show_airport_bad(code):
    return redirect(url_for('show_airport', code=code))


@app.route('/a/<code>')
def show_airport(code):
    airport = app.data.get(code)
    if airport is None:
        airport = app.data.get_random()
    return render_template("index.html", airport=airport, airports=app.data.get_random_list(10))


@app.route('/api/random')
def api_random():
    return jsonify(airport=app.data.get_random())


@app.route('/api/get/<code>')
def api_get(code):
    return jsonify(airport=app.data.get(code))


@app.route('/api/search', methods=['POST'])
def search():
    query = request.form['q']
    return jsonify(airport=app.data.search(query))


@app.route('/sitemap.txt')
def sitemap():
    return render_template("sitemap.txt", ids=app.data.get_all_ids())


@app.route('/robots.txt')
def robots():
    return render_template("robots.txt")
