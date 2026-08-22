"""
Intelligent Asset Lifecycle Management - Backend (Hackathon Prototype)
========================================================================
Flask REST API using in-memory storage only (no database).

User flow supported:
  1. User adds a machine          -> POST /api/machines
  2. Frontend lists machines      -> GET  /api/machines
  3. User selects a machine       -> GET  /api/machines/<machine_id>
  4. Frontend renders dashboard   -> (uses the response above)
  5. Machine can be updated       -> PUT  /api/machines/<machine_id>
  6. Machine can be deleted       -> DELETE /api/machines/<machine_id>

AI prediction fields are placeholders (null) until ML models are
trained and integrated later. No ML code runs in this backend yet.

Run:
    pip install -r requirements.txt
    python app.py
Server starts at http://localhost:5000
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import itertools

app = Flask(__name__)
CORS(app)

# ----------------------------------------------------------------------
# IN-MEMORY STORAGE
# ----------------------------------------------------------------------
machines = {}                     # machine_id (int) -> machine record (dict)
_id_counter = itertools.count(1)  # generates unique, incrementing machine IDs


def make_prediction_placeholder():
    """AI prediction section - placeholder only, no ML runs here yet."""
    return {
        "failure_risk": None,
        "remaining_useful_life": None,
        "failure_type": None,
        "risk_level": None,
        "recommendation": None,
    }


def build_dashboard_response(machine):
    """Shapes a stored machine record into the full dashboard response."""
    return {
        "machine": {
            "id": machine["id"],
            "name": machine["name"],
            "status": machine["status"],
            "last_reading": machine["last_reading"],
        },
        "condition": {
            "vibration_rms": machine["vibration_rms"],
            "motor_temperature": machine["motor_temperature"],
            "current_phase_avg": machine["current_phase_avg"],
            "pressure_level": machine["pressure_level"],
            "rpm": machine["rpm"],
            "operating_mode": machine["operating_mode"],
            "ambient_temperature": machine["ambient_temperature"],
        },
        "maintenance": {
            "hours_since_last_maintenance": machine["hours_since_last_maintenance"],
        },
        "prediction": machine["prediction"],
        "financial": {
            "estimated_repair_cost": machine["estimated_repair_cost"],
        },
    }


# ----------------------------------------------------------------------
# POST /api/machines - Add a new machine
# ----------------------------------------------------------------------
@app.route("/api/machines", methods=["POST"])
def add_machine():
    data = request.get_json(silent=True) or {}

    name = data.get("name")
    if not name or not isinstance(name, str) or not name.strip():
        return jsonify({"error": "Machine 'name' is required"}), 400

    machine_id = next(_id_counter)

    machine = {
        "id": machine_id,
        "name": name.strip(),
        "status": data.get("status", "ACTIVE"),
        "last_reading": datetime.utcnow().isoformat(),
        "vibration_rms": data.get("vibration_rms"),
        "motor_temperature": data.get("motor_temperature"),
        "current_phase_avg": data.get("current_phase_avg"),
        "pressure_level": data.get("pressure_level"),
        "rpm": data.get("rpm"),
        "operating_mode": data.get("operating_mode"),
        "ambient_temperature": data.get("ambient_temperature"),
        "hours_since_last_maintenance": data.get("hours_since_last_maintenance"),
        "estimated_repair_cost": data.get("estimated_repair_cost"),
        "prediction": make_prediction_placeholder(),
    }

    machines[machine_id] = machine

    return jsonify({
        "message": "Machine added successfully",
        "machine_id": machine_id,
    }), 201


# ----------------------------------------------------------------------
# GET /api/machines - List all machines (for selection screen)
# ----------------------------------------------------------------------
@app.route("/api/machines", methods=["GET"])
def list_machines():
    summary = [
        {
            "id": m["id"],
            "name": m["name"],
            "status": m["status"],
            "last_reading": m["last_reading"],
        }
        for m in machines.values()
    ]
    return jsonify(summary), 200


# ----------------------------------------------------------------------
# GET /api/machines/<machine_id> - Full dashboard for selected machine
# ----------------------------------------------------------------------
@app.route("/api/machines/<int:machine_id>", methods=["GET"])
def get_machine(machine_id):
    machine = machines.get(machine_id)
    if not machine:
        return jsonify({"error": "Machine not found"}), 404

    return jsonify(build_dashboard_response(machine)), 200


# ----------------------------------------------------------------------
# PUT /api/machines/<machine_id> - Update a machine
# ----------------------------------------------------------------------
@app.route("/api/machines/<int:machine_id>", methods=["PUT"])
def update_machine(machine_id):
    machine = machines.get(machine_id)
    if not machine:
        return jsonify({"error": "Machine not found"}), 404

    data = request.get_json(silent=True) or {}

    updatable_fields = [
        "name", "status", "vibration_rms", "motor_temperature",
        "current_phase_avg", "pressure_level", "rpm", "operating_mode",
        "ambient_temperature", "hours_since_last_maintenance",
        "estimated_repair_cost",
    ]

    if "name" in data and (not data["name"] or not str(data["name"]).strip()):
        return jsonify({"error": "Machine 'name' cannot be empty"}), 400

    for field in updatable_fields:
        if field in data:
            machine[field] = data[field]

    machine["last_reading"] = datetime.utcnow().isoformat()

    return jsonify({
        "message": "Machine updated successfully",
        "machine": build_dashboard_response(machine),
    }), 200


# ----------------------------------------------------------------------
# DELETE /api/machines/<machine_id> - Delete a machine
# ----------------------------------------------------------------------
@app.route("/api/machines/<int:machine_id>", methods=["DELETE"])
def delete_machine(machine_id):
    if machine_id not in machines:
        return jsonify({"error": "Machine not found"}), 404

    del machines[machine_id]
    return jsonify({"message": "Machine deleted successfully"}), 200


if __name__ == "__main__":
    app.run(debug=True, port=5000)