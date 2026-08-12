import urllib.request
import urllib.parse
import json

backend_url = "https://ai-proctored-exam-platform-iv1t.onrender.com"

users = [
    ("student@example.com", "password123"),
    ("examiner@example.com", "password123"),
    ("admin@example.com", "password123")
]

for email, password in users:
    try:
        data = urllib.parse.urlencode({"username": email, "password": password}).encode('utf-8')
        req = urllib.request.Request(f"{backend_url}/auth/login", data=data, headers={"Content-Type": "application/x-www-form-urlencoded"})
        with urllib.request.urlopen(req, timeout=10) as res:
            res_data = json.loads(res.read().decode())
            print(f"User {email}: LOGIN SUCCESSFUL! Token received.")
    except Exception as e:
        print(f"User {email} login failed: {e}")
