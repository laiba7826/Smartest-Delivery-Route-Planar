from flask import Flask, request, jsonify, session, send_from_directory, render_template
from flask_cors import CORS
import json
import os
from typing import Dict, List, Optional

from algorithms.ai_router import ai_route
from utils.data import NODE_LOCATIONS, get_all_nodes

app = Flask(__name__, template_folder="templates", static_folder="static")
app.secret_key = "srdp_secret_key_2025"

CORS(app, supports_credentials=True)

USERS_FILE = "users.json"


def load_users() -> Dict:
    if not os.path.exists(USERS_FILE):
        return {}
    try:
        with open(USERS_FILE, "r") as f:
            return json.load(f)
    except:
        return {}


def save_users(users: Dict):
    with open(USERS_FILE, "w") as f:
        json.dump(users, f, indent=2)


@app.route("/")
@app.route("/index.html")
def index():
    return render_template("index.html")


@app.route("/dashboard.html")
def dashboard():
    return render_template("dashboard.html")


@app.route("/static/<path:filename>")
def serve_static(filename):
    return send_from_directory("static", filename)


@app.route("/api/signup", methods=["POST"])
def signup():
    data = request.get_json()
    username = data.get("username", "").strip()
    password = data.get("password", "")

    if not username or len(username) < 3:
        return jsonify(
            {"success": False, "message": "Username must be at least 3 characters"}
        ), 400

    if not password or len(password) < 6:
        return jsonify(
            {"success": False, "message": "Password must be at least 6 characters"}
        ), 400

    if not username.replace("_", "").isalnum():
        return jsonify(
            {
                "success": False,
                "message": "Username can only contain letters, numbers, and underscores",
            }
        ), 400

    users = load_users()

    if username in users:
        return jsonify({"success": False, "message": "Username already exists"}), 400

    users[username] = {"password": password}
    save_users(users)

    session["user"] = username

    return jsonify({"success": True, "username": username})


@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    username = data.get("username", "").strip()
    password = data.get("password", "")

    if not username or not password:
        return jsonify({"success": False, "message": "Please fill in all fields"}), 400

    users = load_users()

    if username not in users or users[username].get("password") != password:
        return jsonify(
            {"success": False, "message": "Invalid username or password"}
        ), 401

    session["user"] = username

    return jsonify({"success": True, "username": username})


@app.route("/api/logout", methods=["POST"])
def logout():
    session.pop("user", None)
    return jsonify({"success": True})


@app.route("/api/locations", methods=["GET"])
def locations():
    return jsonify(
        {"success": True, "locations": NODE_LOCATIONS, "nodes": get_all_nodes()}
    )


@app.route("/api/plan_route", methods=["POST"])
def plan_route():
    data = request.get_json()
    start = data.get("start", "").upper()
    end = data.get("end", "").upper()
    options = data.get("options", [])

    if not start or not end:
        return jsonify(
            {"success": False, "message": "Start and end locations required"}
        ), 400

    if start not in NODE_LOCATIONS or end not in NODE_LOCATIONS:
        return jsonify({"success": False, "message": "Invalid location(s)"}), 400

    if start == end:
        return jsonify(
            {"success": False, "message": "Start and end must be different"}
        ), 400

    result = ai_route(start, end, options)

    if result and result.get("path"):
        response = {
            "success": True,
            "result": {
                "path": result["path"],
                "total_dist": round(result["total_dist"], 2),
                "algorithm": result.get("algorithm", "astar"),
                "reason": result.get("reason", ""),
                "stops": len(result["path"]),
                "options": options,
            },
        }
        return jsonify(response)
    else:
        return jsonify({"success": False, "message": "No route found"}), 404


@app.route("/api/nodes", methods=["GET"])
def nodes():
    return jsonify(
        {"success": True, "nodes": get_all_nodes(), "count": len(get_all_nodes())}
    )


@app.route("/api/graph", methods=["GET"])
def graph():
    from utils.data import GRAPH

    return jsonify({"success": True, "graph": GRAPH})


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
