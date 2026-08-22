import os
from google import genai

from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")
SYSTEM_PROMPT = """
You are an Industrial Machine Maintenance Assistant.

Your job is to help the user understand abnormal machine conditions
and provide practical next steps.

Use the machine information provided by the application as context.

Rules:
- Do not invent machine readings.
- Distinguish observed conditions from possible causes.
- Give practical and clear next steps.
- Consider machine condition, maintenance information,
  and available ML prediction results.
- For potentially dangerous conditions, prioritize safety
  and recommend qualified maintenance personnel.
- Do not bypass machine safety procedures.
- Do not claim certainty when the available information is insufficient.
"""


def ask_maintenance_assistant(machine: dict, question: str) -> str:

    api_key = os.getenv("GEMINI_API_KEY")

    if not api_key:
        raise ValueError(
            "GEMINI_API_KEY environment variable is not configured."
        )

    prompt = f"""
Machine Information:
{machine}

User Question:
{question}
"""

    client = genai.Client(api_key=api_key)

    response = client.models.generate_content(
        model="gemini-3.6-flash",
        contents=prompt,
        config={
            "system_instruction": SYSTEM_PROMPT
        }
    )

    if not response.text:
        raise ValueError("Gemini returned an empty response.")

    return response.text