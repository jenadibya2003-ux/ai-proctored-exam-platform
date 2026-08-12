import urllib.request
import json

backend_url = "https://ai-proctored-exam-platform-iv1t.onrender.com"

# 1. Register student@example.com
try:
    payload = json.dumps({
        "email": "student@example.com",
        "password": "password123",
        "full_name": "Demo Student",
        "role": "student"
    }).encode('utf-8')
    req = urllib.request.Request(f"{backend_url}/auth/register", data=payload, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=15) as res:
        print("Register status:", res.getcode())
        print("Register response:", res.read().decode())
except urllib.error.HTTPError as e:
    print("Register HTTP Error:", e.code, e.read().decode())
except Exception as e:
    print("Register Error:", e)
