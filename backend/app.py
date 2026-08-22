"""
Intelligent Asset Lifecycle Management - Backend
================================================

Flask REST API integrating:

    Model 1 -> Random Forest Failure Prediction
    Model 2 -> RUL Prediction
    Model 3 -> Lifecycle Decision Engine

User flow:

    1. Add machine
        POST /api/machines

    2. List machines
        GET /api/machines

    3. View machine dashboard
        GET /api/machines/<machine_id>

    4. Update machine
        PUT /api/machines/<machine_id>

    5. Delete machine
        DELETE /api/machines/<machine_id>

    6. Ask Gemini maintenance assistant
        POST /api/machines/<machine_id>/assistant

The backend uses in-memory storage only.

Expected model files:

    models/
        random_forest_asset_failure_model.joblib
        random_forest_rul_model.joblib

Run:

    pip install -r requirements.txt
    python app.py

Server:

    http://localhost:5000
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import itertools
import os
import joblib
import pandas as pd

# Gemini-powered maintenance assistant
from gemini_service import ask_maintenance_assistant

app = Flask(__name__)
CORS(app)

# ======================================================================
# MODEL PATHS
# ======================================================================

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_DIR = os.path.join(
    BASE_DIR,
    "..",
    "models"
)

FAILURE_MODEL_PATH = os.path.join(
    MODEL_DIR,
    "random_forest_asset_failure_model.joblib"
)

RUL_MODEL_PATH = os.path.join(
    MODEL_DIR,
    "random_forest_rul_model.joblib"
)


# ======================================================================
# LOAD MODELS
# ======================================================================

try:
    failure_model = joblib.load(FAILURE_MODEL_PATH)
    print("✓ Failure model loaded successfully")

except Exception as e:
    failure_model = None
    print("WARNING: Could not load failure model")
    print(e)


try:
    rul_model = joblib.load(RUL_MODEL_PATH)
    print("✓ RUL model loaded successfully")

except Exception as e:
    rul_model = None
    print("WARNING: Could not load RUL model")
    print(e)

# ======================================================================
# IN-MEMORY STORAGE
# ======================================================================

machines = {}

_id_counter = itertools.count(1)

# ======================================================================
# FEATURE ENGINEERING
# ======================================================================

def prepare_model_input(machine):
    """
    Convert the backend machine object into the feature structure
    expected by the trained ML models.

    Important:
    The saved pipelines expect the original timestamp column,
    therefore timestamp is NOT removed here.
    """
    timestamp = machine.get("last_reading")
    if not timestamp:
        timestamp = datetime.utcnow().isoformat()
    data = {
        # Original model features
        "timestamp": timestamp,
        "machine_id": machine.get("machine_id"),
        "machine_type": machine.get(
            "machine_type",
            "STANDARD"
        ),
        "vibration_rms": machine.get(
            "vibration_rms"
        ),
        "temperature_motor": machine.get(
            "motor_temperature"
        ),
        "current_phase_avg": machine.get(
            "current_phase_avg"
        ),
        "pressure_level": machine.get(
            "pressure_level"
        ),
        "rpm": machine.get(
            "rpm"
        ),
        "operating_mode": machine.get(
            "operating_mode",
            "NORMAL"
        ),
        "hours_since_maintenance": machine.get(
            "hours_since_last_maintenance"
        ),
        "ambient_temp": machine.get(
            "ambient_temperature"
        ),
    }

    df = pd.DataFrame([data])

    # --------------------------------------------------------------
    # ENGINEERED FEATURE 1
    # --------------------------------------------------------------
    df["temperature_rise"] = (
        df["temperature_motor"]
        - df["ambient_temp"]
    )

    # --------------------------------------------------------------
    # ENGINEERED FEATURE 2
    # --------------------------------------------------------------
    df["electrical_load_index"] = (
        df["current_phase_avg"]
        * df["rpm"]
    )
    return df


# ======================================================================
# MODEL 3 - LIFECYCLE DECISION ENGINE
# ======================================================================

def lifecycle_decision(
    failure_probability,
    rul_hours,
    criticality="Medium",
    repair_cost=0,
    hours_since_maintenance=0,
    previous_failures=0
):
    """
    Converts ML predictions into an explainable lifecycle decision.

    Returns:

        risk_score
        risk_level
        recommendation
        reason
    """

    failure_probability = float(
        max(0, min(1, failure_probability))
    )

    rul_hours = max(
        0,
        float(rul_hours)
    )

    repair_cost = max(
        0,
        float(repair_cost or 0)
    )

    hours_since_maintenance = max(
        0,
        float(hours_since_maintenance or 0)
    )

    previous_failures = max(
        0,
        int(previous_failures or 0)
    )

    criticality = str(
        criticality or "Medium"
    ).strip().lower()

    # --------------------------------------------------------------
    # FAILURE RISK SCORE
    # --------------------------------------------------------------

    failure_score = failure_probability * 50

    # --------------------------------------------------------------
    # RUL SCORE
    # --------------------------------------------------------------

    if rul_hours <= 24:

        rul_score = 30

    elif rul_hours <= 48:

        rul_score = 24

    elif rul_hours <= 72:

        rul_score = 18

    elif rul_hours <= 168:

        rul_score = 10

    else:

        rul_score = 0

    # --------------------------------------------------------------
    # CRITICALITY SCORE
    # --------------------------------------------------------------
    criticality_score = {
        "low": 0,
        "medium": 5,
        "high": 10,
        "critical": 15

    }.get(
        criticality,
        5
    )

    # --------------------------------------------------------------
    # MAINTENANCE HISTORY SCORE
    # --------------------------------------------------------------

    history_score = min(
        5,
        (hours_since_maintenance / 500) * 3
        + previous_failures * 0.75
    )

    # --------------------------------------------------------------
    # FINAL RISK SCORE
    # --------------------------------------------------------------

    risk_score = min(
        100,
        failure_score
        + rul_score
        + criticality_score
        + history_score
    )

    # --------------------------------------------------------------
    # RISK LEVEL
    # -------------------------------------------------------------
    if risk_score >= 70:
        risk_level = "CRITICAL"
    elif risk_score >= 50:
        risk_level = "HIGH"
    elif risk_score >= 30:
        risk_level = "MEDIUM"

    else:
        risk_level = "LOW"

    # --------------------------------------------------------------
    # RECOMMENDATION
    # --------------------------------------------------------------

    if (
        failure_probability >= 0.75
        and rul_hours <= 24
    ):
        recommendation = "URGENT MAINTENANCE"
        reason = (
            "Very high failure probability combined "
            "with less than 24 hours of predicted RUL."
        )
    elif (
        failure_probability >= 0.60
        and rul_hours <= 48
    ):
        recommendation = "SCHEDULE MAINTENANCE"

        reason = (
            "High failure probability and short "
            "remaining useful life."
        )

    elif (
        criticality in ["high", "critical"]
        and (
            failure_probability >= 0.50
            or rul_hours <= 48
        )
    ):

        recommendation = "PRIORITY INSPECTION"

        reason = (
            "The asset has high operational criticality "
            "and elevated lifecycle risk."
        )

    elif failure_probability >= 0.50:

        recommendation = "MONITOR CLOSELY"

        reason = (
            "Failure probability is elevated but "
            "immediate maintenance is not yet required."
        )

    elif rul_hours <= 24:

        recommendation = "INSPECT ASSET"

        reason = (
            "Predicted remaining useful life is "
            "less than 24 hours."
        )

    else:

        recommendation = "NORMAL OPERATION"

        reason = (
            "Current failure probability and predicted "
            "RUL do not indicate immediate intervention."
        )

    # --------------------------------------------------------------
    # REPLACEMENT CONSIDERATION
    # --------------------------------------------------------------

    replacement_flag = False

    if (
        repair_cost >= 100000
        and criticality == "low"
        and (
            failure_probability >= 0.60
            or rul_hours <= 48
        )
    ):

        replacement_flag = True

        recommendation = "EVALUATE REPLACEMENT"

        reason = (
            "High repair cost combined with low asset "
            "criticality and elevated lifecycle risk."
        )

    return {

        "risk_score": round(
            risk_score,
            2
        ),

        "risk_level": risk_level,

        "recommendation": recommendation,

        "replacement_flag": replacement_flag,

        "reason": reason
    }


# ======================================================================
# RUN ALL THREE MODELS
# ======================================================================

def generate_prediction(machine):
    """
    Run:

        Model 1 -> Failure probability
        Model 2 -> RUL
        Model 3 -> Lifecycle decision
    """
    # --------------------------------------------------------------
    # Check models
    # --------------------------------------------------------------

    if failure_model is None:

        return {
            "failure_risk": None,
            "remaining_useful_life": None,
            "risk_level": "MODEL ERROR",
            "recommendation": "Failure model unavailable",
            "reason": "Failure prediction model could not be loaded."
        }

    if rul_model is None:

        return {
            "failure_risk": None,
            "remaining_useful_life": None,
            "risk_level": "MODEL ERROR",
            "recommendation": "RUL model unavailable",
            "reason": "RUL prediction model could not be loaded."
        }
    try:
        # ----------------------------------------------------------
        # Prepare input
        # ----------------------------------------------------------
        model_input = prepare_model_input(
            machine
        )
        #----------------------------------------------------------
        # MODEL 1
        # Failure probability
        # ----------------------------------------------------------
        failure_probabilities = (
            failure_model.predict_proba(
                model_input
            )[0]
        )
        # Assuming:
        # column 0 = No Failure
        # column 1 = Failure
        failure_probability = float(
            failure_probabilities[1]
        )

        # ----------------------------------------------------------
        # MODEL 2
        # RUL
        # ----------------------------------------------------------
        predicted_rul = float(
            rul_model.predict(
                model_input
            )[0]
        )

        # Don't allow negative RUL
        predicted_rul = max(
            0,
            predicted_rul
        )

        # ----------------------------------------------------------
        # MODEL 3
        # Decision engine
        # ----------------------------------------------------------
        decision = lifecycle_decision(
            failure_probability=failure_probability,
            rul_hours=predicted_rul,
            criticality=machine.get(
                "criticality",
                "Medium"
            ),

            repair_cost=machine.get(
                "estimated_repair_cost",
                0
            ),

            hours_since_maintenance=machine.get(
                "hours_since_last_maintenance",
                0
            ),

            previous_failures=machine.get(
                "previous_failures",
                0
            )
        )

        # ----------------------------------------------------------
        # Final prediction response
        # ----------------------------------------------------------

        return {

            "failure_risk": round(
                failure_probability,
                4
            ),

            "failure_risk_percentage": round(
                failure_probability * 100,
                2
            ),

            "remaining_useful_life": round(
                predicted_rul,
                2
            ),

            "risk_score": decision[
                "risk_score"
            ],

            "risk_level": decision[
                "risk_level"
            ],

            "recommendation": decision[
                "recommendation"
            ],

            "replacement_flag": decision[
                "replacement_flag"
            ],

            "reason": decision[
                "reason"
            ]
        }

    except Exception as e:

        print(
            "Prediction error:",
            str(e)
        )

        return {
            "failure_risk": None,
            "failure_risk_percentage": None,
            "remaining_useful_life": None,
            "risk_score": None,
            "risk_level": "PREDICTION ERROR",
            "recommendation": "Prediction failed",
            "replacement_flag": False,
            "reason": str(e)
        }


# ======================================================================
# DASHBOARD RESPONSE
# ======================================================================

def build_dashboard_response(machine):
    return {
        "machine": {
            "id": machine["id"],
            "name": machine["name"],
            "status": machine["status"],
            "machine_type": machine[
                "machine_type"
            ],
            "last_reading": machine[
                "last_reading"
            ],
        },
        "condition": {
            "vibration_rms": machine[
                "vibration_rms"
            ],
            "motor_temperature": machine[
                "motor_temperature"
            ],
            "current_phase_avg": machine[
                "current_phase_avg"
            ],
            "pressure_level": machine[
                "pressure_level"
            ],
            "rpm": machine[
                "rpm"
            ],
            "operating_mode": machine[
                "operating_mode"
            ],

            "ambient_temperature": machine[
                "ambient_temperature"
            ],

            "temperature_rise": machine.get(
                "temperature_rise"
            ),

            "electrical_load_index": machine.get(
                "electrical_load_index"
            )
        },
        "maintenance": {

            "hours_since_last_maintenance":
                machine[
                    "hours_since_last_maintenance"
                ],

            "previous_failures":
                machine.get(
                    "previous_failures",
                    0
                )
        },

        "prediction": machine[
            "prediction"
        ],

        "financial": {

            "estimated_repair_cost":
                machine[
                    "estimated_repair_cost"
                ]
        },
        "asset": {
            "criticality":
                machine[
                    "criticality"
                ]
        }
    }


# ======================================================================
# POST /api/machines
# ======================================================================

@app.route(
    "/api/machines",
    methods=["POST"]
)
def add_machine():

    data = request.get_json(
        silent=True
    ) or {}

    # --------------------------------------------------------------
    # Validate machine name
    # --------------------------------------------------------------

    name = data.get(
        "name"
    )

    if (
        not name
        or not isinstance(name, str)
        or not name.strip()
    ):

        return jsonify({
            "error":
                "Machine 'name' is required"
        }), 400

    # --------------------------------------------------------------
    # Generate ID
    # --------------------------------------------------------------

    machine_id = next(
        _id_counter
    )

    # --------------------------------------------------------------
    # Create machine
    # --------------------------------------------------------------

    machine = {

        "id": machine_id,

        "machine_id": data.get(
            "machine_id",
            machine_id
        ),

        "name": name.strip(),

        "status": data.get(
            "status",
            "ACTIVE"
        ),

        "machine_type": data.get(
            "machine_type",
            "STANDARD"
        ),

        "last_reading":
            datetime.utcnow().isoformat(),

        "vibration_rms":
            data.get(
                "vibration_rms"
            ),

        "motor_temperature":
            data.get(
                "motor_temperature"
            ),

        "current_phase_avg":
            data.get(
                "current_phase_avg"
            ),

        "pressure_level":
            data.get(
                "pressure_level"
            ),

        "rpm":
            data.get(
                "rpm"
            ),

        "operating_mode":
            data.get(
                "operating_mode",
                "NORMAL"
            ),

        "ambient_temperature":
            data.get(
                "ambient_temperature"
            ),

        "hours_since_last_maintenance":
            data.get(
                "hours_since_last_maintenance"
            ),

        "estimated_repair_cost":
            data.get(
                "estimated_repair_cost",
                0
            ),

        "criticality":
            data.get(
                "criticality",
                "Medium"
            ),

        "previous_failures":
            data.get(
                "previous_failures",
                0
            ),

        "temperature_rise":
            None,

        "electrical_load_index":
            None,

        "prediction": None
    }

    # --------------------------------------------------------------
    # Feature values for dashboard
    # --------------------------------------------------------------

    if (
        machine["motor_temperature"] is not None
        and machine["ambient_temperature"] is not None
    ):

        machine[
            "temperature_rise"
        ] = (
            machine["motor_temperature"]
            - machine["ambient_temperature"]
        )

    if (
        machine["current_phase_avg"] is not None
        and machine["rpm"] is not None
    ):

        machine[
            "electrical_load_index"
        ] = (
            machine["current_phase_avg"]
            * machine["rpm"]
        )

    # --------------------------------------------------------------
    # RUN AI
    # --------------------------------------------------------------

    machine[
        "prediction"
    ] = generate_prediction(
        machine
    )

    # --------------------------------------------------------------
    # Save
    # --------------------------------------------------------------

    machines[
        machine_id
    ] = machine

    return jsonify({

        "message":
            "Machine added successfully",

        "machine_id":
            machine_id,

        "prediction":
            machine["prediction"]

    }), 201


# ======================================================================
# GET /api/machines
# ======================================================================

@app.route(
    "/api/machines",
    methods=["GET"]
)
def list_machines():
    summary = [
        {
            "id": m["id"],
            "name": m["name"],
            "status": m["status"],
            "machine_type":
                m["machine_type"],

            "risk_level":
                (
                    m["prediction"]
                    or {}
                ).get(
                    "risk_level"
                ),

            "failure_risk":
                (
                    m["prediction"]
                    or {}
                ).get(
                    "failure_risk"
                ),

            "remaining_useful_life":
                (
                    m["prediction"]
                    or {}
                ).get(
                    "remaining_useful_life"
                ),

            "last_reading":
                m["last_reading"]
        }
        for m in machines.values()
    ]

    return jsonify(
        summary
    ), 200


# ======================================================================
# GET /api/machines/<machine_id>
# ======================================================================

@app.route(
    "/api/machines/<int:machine_id>",
    methods=["GET"]
)
def get_machine(
    machine_id
):
    machine = machines.get(
        machine_id
    )
    if not machine:
        return jsonify({
            "error":
                "Machine not found"
        }), 404
    return jsonify(
        build_dashboard_response(
            machine
        )
    ), 200


# ======================================================================
# PUT /api/machines/<machine_id>
# ======================================================================
@app.route(
    "/api/machines/<int:machine_id>",
    methods=["PUT"]
)
def update_machine(
    machine_id
):
    machine = machines.get(
        machine_id
    )
    if not machine:

        return jsonify({
            "error":
                "Machine not found"
        }), 404

    data = request.get_json(
        silent=True
    ) or {}

    updatable_fields = [
        "name",
        "status",
        "machine_type",
        "vibration_rms",
        "motor_temperature",
        "current_phase_avg",
        "pressure_level",
        "rpm",
        "operating_mode",
        "ambient_temperature",
        "hours_since_last_maintenance",
        "estimated_repair_cost",
        "criticality",
        "previous_failures"
    ]

    # --------------------------------------------------------------
    # Validate name
    # --------------------------------------------------------------

    if (
        "name" in data
        and (
            not data["name"]
            or not str(
                data["name"]
            ).strip()
        )
    ):
        return jsonify({
            "error":
                "Machine 'name' cannot be empty"
        }), 400
    # --------------------------------------------------------------
    # Update fields
    # --------------------------------------------------------------
    for field in updatable_fields:
        if field in data:
            machine[
                field
            ] = data[field]
    machine[
        "last_reading"
    ] = datetime.utcnow().isoformat()

    # --------------------------------------------------------------
    # Recalculate engineered features
    # --------------------------------------------------------------
    if (
        machine["motor_temperature"]
        is not None
        and
        machine["ambient_temperature"]
        is not None
    ):
        machine[
            "temperature_rise"
        ] = (
            machine["motor_temperature"]
            - machine["ambient_temperature"]
        )
    if (
        machine["current_phase_avg"]
        is not None
        and
        machine["rpm"]
        is not None
    ):
        machine[
            "electrical_load_index"
        ] = (
            machine["current_phase_avg"]
            * machine["rpm"]
        )
    # --------------------------------------------------------------
    # RE-RUN AI
    # --------------------------------------------------------------
    machine[
        "prediction"
    ] = generate_prediction(
        machine
    )
    return jsonify({
        "message":
            "Machine updated successfully",
        "machine":
            build_dashboard_response(
                machine
            )
    }), 200

# ======================================================================
# DELETE /api/machines/<machine_id>
# ======================================================================

@app.route(
    "/api/machines/<int:machine_id>",
    methods=["DELETE"]
)
def delete_machine(
    machine_id
):
    if machine_id not in machines:
        return jsonify({
            "error":
                "Machine not found"
        }), 404
    del machines[
        machine_id
    ]
    return jsonify({
        "message":
            "Machine deleted successfully"
    }), 200


# ======================================================================
# POST /api/machines/<machine_id>/assistant
# ======================================================================

@app.route(
    "/api/machines/<int:machine_id>/assistant",
    methods=["POST"]
)
def ask_assistant(machine_id):

    # --------------------------------------------------------------
    # Find machine
    # --------------------------------------------------------------

    machine = machines.get(machine_id)

    if not machine:
        return jsonify({
            "error": "Machine not found"
        }), 404

    # --------------------------------------------------------------
    # Get user question
    # --------------------------------------------------------------

    data = request.get_json(
        silent=True
    ) or {}

    question = data.get("question")

    if (
        not question
        or not isinstance(question, str)
        or not question.strip()
    ):
        return jsonify({
            "error": "Question is required"
        }), 400

    # --------------------------------------------------------------
    # Send machine context + user question to Gemini
    # --------------------------------------------------------------

    try:
        answer = ask_maintenance_assistant(
            machine=machine,
            question=question.strip()
        )

        return jsonify({
            "machine_id": machine_id,
            "question": question.strip(),
            "answer": answer,
            "status": "success"
        }), 200

    except ValueError as e:

        return jsonify({
            "error": str(e)
        }), 500

    except Exception as e:

        print("Gemini assistant error:", str(e))

        return jsonify({
            "error": "Gemini assistant is currently unavailable"
        }), 502


# ======================================================================
# HEALTH CHECK
# ======================================================================

@app.route(
    "/api/health",
    methods=["GET"]
)
def health():
    return jsonify({
        "status":
            "ok",
        "failure_model_loaded":
            failure_model is not None,
        "rul_model_loaded":
            rul_model is not None,

        "decision_engine":
            True

    }), 200


# ======================================================================
# RUN SERVER
# ======================================================================
@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "status": "running",
        "message": "Intelligent Asset Lifecycle Management API",
        "endpoints": [
            "/api/machines",
            "/api/machines/<machine_id>"
        ]
    }), 200


if __name__ == "__main__":

    print()
    print("=" * 60)
    print(
        "INTELLIGENT ASSET LIFECYCLE MANAGEMENT"
    )
    print("=" * 60)

    print(
        "Failure model:",
        "LOADED"
        if failure_model is not None
        else "NOT LOADED"
    )

    print(
        "RUL model:",
        "LOADED"
        if rul_model is not None
        else "NOT LOADED"
    )

    print(
        "Decision engine: ACTIVE"
    )

    print(
        "Server: http://localhost:5000"
    )

    print("=" * 60)
    print()

    app.run(
        debug=True,
        port=5000
    )