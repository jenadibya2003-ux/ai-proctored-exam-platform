import os

frontend_dir = r"d:\exam-platform-starter\frontend\app"

api_helper_code = '''const getApiBase = () => {
  const envUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (typeof window !== "undefined") {
    if (!envUrl || envUrl.includes("localhost") || envUrl.includes("127.0.0.1")) {
      if (window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
        return "https://ai-proctored-exam-platform-iv1t.onrender.com";
      }
    }
  }
  return envUrl || "https://ai-proctored-exam-platform-iv1t.onrender.com";
};
const API_BASE = getApiBase();'''

count = 0
for root, dirs, files in os.walk(frontend_dir):
    for f in files:
        if f.endswith('.tsx') or f.endswith('.ts'):
            filepath = os.path.join(root, f)
            with open(filepath, 'r', encoding='utf-8') as file:
                content = file.read()
            
            # Find and replace old API_BASE definition
            if 'const API_BASE =' in content and 'getApiBase' not in content:
                # Find line containing const API_BASE =
                lines = content.splitlines()
                new_lines = []
                for line in lines:
                    if line.strip().startswith('const API_BASE ='):
                        new_lines.append(api_helper_code)
                    else:
                        new_lines.append(line)
                new_content = '\n'.join(new_lines)
                with open(filepath, 'w', encoding='utf-8') as file:
                    file.write(new_content)
                count += 1
                print(f"Updated dynamic API_BASE in {filepath}")

print(f"Total files updated with dynamic API detection: {count}")
