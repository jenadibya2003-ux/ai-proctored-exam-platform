import os
import glob

frontend_dir = r"d:\exam-platform-starter\frontend\app"
target = 'const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";'
replacement = 'const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "https://ai-proctored-exam-platform-iv1t.onrender.com";'

count = 0
for root, dirs, files in os.walk(frontend_dir):
    for f in files:
        if f.endswith('.tsx') or f.endswith('.ts'):
            filepath = os.path.join(root, f)
            with open(filepath, 'r', encoding='utf-8') as file:
                content = file.read()
            if target in content:
                new_content = content.replace(target, replacement)
                with open(filepath, 'w', encoding='utf-8') as file:
                    file.write(new_content)
                count += 1
                print(f"Updated {filepath}")

print(f"Total files updated: {count}")
