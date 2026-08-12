import json

transcript_path = r"C:\Users\Jyotirmayee\.gemini\antigravity\brain\261f6ca8-831b-4be8-8219-7415938311c2\.system_generated\logs\transcript.jsonl"

with open(transcript_path, "r", encoding="utf-8") as f:
    for line in f:
        if '"type":"USER_INPUT"' in line:
            data = json.loads(line)
            content = data.get("content", "")
            if "@" in content or "login" in content.lower() or "user" in content.lower() or "password" in content.lower():
                print(f"USER: {content}")
