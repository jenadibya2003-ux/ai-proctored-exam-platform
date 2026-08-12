import urllib.request
import urllib.parse
import json

backend_url = "https://ai-proctored-exam-platform-iv1t.onrender.com"

# Register student user
try:
    payload = json.dumps({
        "email": "student@example.com",
        "password": "password123",
        "full_name": "Demo Student",
        "role": "student"
    }).encode('utf-8')
    req = urllib.request.Request(f"{backend_url}/auth/register", data=payload, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=15) as res:
        print("Register Response:", res.read().decode())
except Exception as e:
    print("Register Error:", e)

# Test Login after register
try:
    data = urllib.parse.urlencode({"username": "student@example.com", "password": "password123"}).encode('utf-8')
    req = urllib.request.Request(f"{backend_url}/auth/login", data=data, headers={"Content-Type": "application/x-www-form-urlencoded"})
    with urllib.request.urlopen(req, timeout=15) as res:
        response_json = json.loads(res.read().decode())
        print("Login Check: SUCCESS! Token received:", "access_token" in response_json)
except Exception as e:
    print("Login Error:", e)
