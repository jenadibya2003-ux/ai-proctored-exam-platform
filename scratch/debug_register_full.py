import urllib.request
import urllib.error
import json

backend_url = "https://ai-proctored-exam-platform-iv1t.onrender.com"

# Test register and print the full error detail
try:
    payload = json.dumps({
        "email": "student@example.com",
        "password": "password123",
        "full_name": "Demo Student",
        "role": "student"
    }).encode('utf-8')
    req = urllib.request.Request(
        f"{backend_url}/auth/register",
        data=payload,
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=30) as res:
        print("Register SUCCESS:", res.read().decode())
except urllib.error.HTTPError as e:
    body = e.read().decode()
    print(f"HTTP Error {e.code}:")
    try:
        parsed = json.loads(body)
        print("Detail:", parsed.get("detail", ""))
        print("Traceback:", parsed.get("traceback", "")[:2000])
    except:
        print("Raw body:", body[:2000])
except Exception as e:
    print("Error:", e)
