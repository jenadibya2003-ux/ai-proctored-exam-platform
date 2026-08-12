import urllib.request
import urllib.parse
import json
import time

backend_url = "https://ai-proctored-exam-platform-iv1t.onrender.com"

print("Testing live login for student@example.com...")
for attempt in range(1, 6):
    try:
        data = urllib.parse.urlencode({"username": "student@example.com", "password": "password123"}).encode('utf-8')
        req = urllib.request.Request(f"{backend_url}/auth/login", data=data, headers={"Content-Type": "application/x-www-form-urlencoded"})
        with urllib.request.urlopen(req, timeout=10) as res:
            res_data = json.loads(res.read().decode())
            print(f"Attempt {attempt}: SUCCESS! Access Token length: {len(res_data.get('access_token', ''))}")
            break
    except Exception as e:
        print(f"Attempt {attempt} failed: {e}")
        time.sleep(5)
