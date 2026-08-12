import urllib.request
import json
import time

url = "https://ai-proctored-exam-platform-iv1t.onrender.com/health"
print(f"Testing live Render URL: {url}")

start = time.time()
try:
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=30) as response:
        code = response.getcode()
        body = response.read().decode('utf-8')
        print(f"Status Code: {code}")
        print(f"Response Body: {body}")
        print(f"Time Taken: {time.time() - start:.2f}s")
except Exception as e:
    print(f"Error connecting: {e}")
