import urllib.request
import urllib.parse
import json

backend_url = "https://ai-proctored-exam-platform-iv1t.onrender.com"

# 1. Test Health
try:
    with urllib.request.urlopen(f"{backend_url}/health", timeout=15) as res:
        print("Health Check:", res.read().decode())
except Exception as e:
    print("Health Check Error:", e)

# 2. Test Login
try:
    data = urllib.parse.urlencode({"username": "student@example.com", "password": "password123"}).encode('utf-8')
    req = urllib.request.Request(f"{backend_url}/auth/login", data=data, headers={"Content-Type": "application/x-www-form-urlencoded"})
    with urllib.request.urlopen(req, timeout=15) as res:
        response_json = json.loads(res.read().decode())
        print("Login Check: SUCCESS! Token received:", "access_token" in response_json)
except Exception as e:
    print("Login Check Error:", e)
