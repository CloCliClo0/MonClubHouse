"""Envoi de SMS via l'API ClickSend (equivalent Python de back/services/smsService.js)."""
import os
import re
import sys
import time

import requests
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

API_TOKEN = os.environ.get("CLICKSEND_API_TOKEN")
FROM = os.environ.get("CLICKSEND_FROM")

API_URL = "https://rest.clicksend.com/v3/sms/send"

DEFAULT_TO = "0651420020"
DEFAULT_MESSAGE = "[TEST MCH] Ceci est un SMS de test envoye depuis sms.py"


def normalize_phone(to):
    # Retire espaces, tirets, parentheses, points
    phone = re.sub(r"[\s\-\(\)\.]", "", str(to))
    # Convertit les numeros francais 06/07 -> +336/+337
    if re.match(r"^0[67]", phone):
        phone = "+33" + phone[1:]
    if not re.match(r"^\+?[0-9]{8,15}$", phone):
        raise ValueError(f"Numero invalide ou non supporte : {phone}")
    return phone


def send_sms(to=DEFAULT_TO, message=DEFAULT_MESSAGE):
    if not API_TOKEN:
        return {"sent": False, "reason": "CLICKSEND_API_TOKEN non configuree dans .env"}

    phone = normalize_phone(to)

    msg = {"to": phone, "body": message, "source": "monclubhouse"}
    if FROM:
        msg["from"] = FROM

    headers = {
        "Authorization": f"Bearer {API_TOKEN}",
        "Content-Type": "application/json",
    }

    t0 = time.time()
    try:
        response = requests.post(API_URL, json={"messages": [msg]}, headers=headers, timeout=10)
    except requests.RequestException as err:
        return {"sent": False, "ms": int((time.time() - t0) * 1000), "to": phone, "reason": str(err)}

    ms = int((time.time() - t0) * 1000)
    try:
        data = response.json()
    except ValueError:
        data = {}

    msg_result = (data.get("data") or {}).get("messages", [{}])[0]
    ok = 200 <= response.status_code < 300 and msg_result.get("status") == "SUCCESS"
    if ok:
        return {"sent": True, "ms": ms, "to": phone, "status": response.status_code}

    reason = msg_result.get("status") or data.get("response_msg") or f"HTTP {response.status_code}"
    return {"sent": False, "ms": ms, "to": phone, "reason": reason, "status": response.status_code}


if __name__ == "__main__":
    to = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_TO
    message = sys.argv[2] if len(sys.argv) > 2 else DEFAULT_MESSAGE
    result = send_sms(to, message)
    print(result)
