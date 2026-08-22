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


## Project Structure

```text
codex10-zenesys/
│
├── .idea/
│   ├── inspectionProfiles/
│   ├── .gitignore
│   ├── codex10-zenesys.iml
│   ├── misc.xml
│   ├── modules.xml
│   └── vcs.xml
│
├── backend/
│   ├── app.py
│   └── gemini_service.py
│
├── frontend/
│   ├── index.html
│   └── txt
│
└── README.md
```

##Overall workflow

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
                         │
             ┌───────────┼───────────┐
             ▼           ▼           ▼
          Maintain     Repair     Replace
- Project Status - Under development
- 
