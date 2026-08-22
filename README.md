# codex10-zenesys

# Intelligent Asset Lifecycle management 

Our project focused on using machine learning to make asset maintenance and lifecycle decisions smarter.

The current implementation focuses on:

- Predicting the probability of machine failure
- Comparing different machine learning models
- Identifying high-risk assets
- Generating basic maintenance recommendations
## Problem

Industrial organizations often manage machinery reactively: a machine fails, maintenance is performed, and replacement decisions are made manually. This can lead to:

1. Unplanned downtime
2. High maintenance costs
3. Poor visibility into machine health
4. Premature or delayed asset replacement
5. Difficulty identifying which assets need attention first

## Objectives

The system is designed to:

1. Monitor individual machines and their operating condition.
2. Predict the probability of failure within the next 24 hours.
3. Estimate Remaining Useful Life (RUL).
4. Identify machine risk levels.
5. Recommend maintenance actions.
6. Incorporate maintenance and repair-cost information into lifecycle decisions.
7. Provide an AI assistant for machine-specific questions and lifecycle decisions.

##   Overall Workflow

                    MACHINE DATA
                         │
                         ▼
                Data Preprocessing
                         │
                         ▼
                Feature Engineering
                         │
                         ▼
              Machine Learning Models
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
       Logistic         SVM        Decision Tree
       Regression                       │
          │              │              │
          └──────────────┼──────────────┘
                         ▼
                  Random Forest
                         │
                         ▼
              Failure Probability
                         │
                         ▼
                    Risk Level
                         │
                         ▼
             Maintenance Recommendation
                         │
          ┌──────────────┴──────────────┐
          ▼                             ▼
    Machine Dashboard              AI Copilot
          │                             │
          └──────────────┬──────────────┘
                         ▼
              Asset Lifecycle Decision
             Maintain / Repair / Replace
             

## Failure Prediction

The primary prediction target is:

failure_within_24h

The system predicts whether a machine is likely to experience a failure within the next 24 hours.

The following classification models are implemented and compared:

Logistic Regression
Support Vector Machine (SVM)
Decision Tree
Random Forest

The models are evaluated using:

1] Accuracy
2] Precision
3] Recall
4] F1 Score
5] ROC-AUC

## Dataset

The current dataset contains approximately 24,000 industrial machinery
records.

## Frontend Project Structure

```text
frontend/
├── package.json
├── vite.config.js
├── index.html
├── README.md
│
└── src/
    ├── assets/
    │
    ├── components/
    │   ├── layout/
    │   ├── dashboard/
    │   ├── machines/
    │   ├── analytics/
    │   ├── maintenance/
    │   ├── lifecycle/
    │   ├── resale/
    │   ├── copilot/
    │   └── ui/
    │
    ├── pages/
    │   ├── Login.jsx
    │   ├── Dashboard.jsx
    │   ├── Machines.jsx
    │   ├── MachineProfile.jsx
    │   ├── Analytics.jsx
    │   ├── Maintenance.jsx
    │   ├── Lifecycle.jsx
    │   ├── Resale.jsx
    │   └── Copilot.jsx
    │
    ├── services/
    │   ├── api.js
    │   ├── machineService.js
    │   ├── predictionService.js
    │   ├── maintenanceService.js
    │   ├── lifecycleService.js
    │   ├── resaleService.js
    │   └── copilotService.js
    │
    ├── context/
    │   ├── AuthContext.jsx
    │   └── MachineContext.jsx
    │
    ├── data/
    │   ├── machines.js
    │   ├── maintenance.js
    │   └── analytics.js
    │
    ├── hooks/
    ├── utils/
    ├── App.jsx
    ├── main.jsx
    └── index.css

## Frontend Modules

- **Dashboard** — Overall asset health, machine status, risk distribution, and key asset metrics.
- **Machines** — Search, filter, and select individual machines for detailed analysis.
- **Machine Profile** — Displays machine information, operating conditions, failure probability, RUL, risk level, failure type, repair cost, and AI recommendations.
- **Analytics** — Visualizes sensor readings, machine performance, failure-risk trends, and RUL trends.
- **Maintenance** — Displays maintenance status, maintenance history, upcoming maintenance requirements, and recommended actions.
- **Lifecycle** — Tracks the machine lifecycle and provides insights for maintenance, repair, upgrade, replacement, or retirement decisions.
- **Resale** — Provides machine resale and replacement analysis based on condition, RUL, repair cost, and lifecycle information.
- **Copilot** — AI-powered assistant for machine-specific analysis, maintenance questions, and lifecycle decisions.
- **Services** — Handles communication between the frontend and backend APIs for machines, predictions, maintenance, lifecycle, resale, and AI services.
- **Context** — Manages global application state, including authentication and the currently selected machine.
- Project Status - Under development
- 
