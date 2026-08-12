import sqlite3
import os

db_paths = [
    r"d:\exam-platform-starter\backend\exam_platform.db",
    r"d:\exam-platform-starter\backend\sql_app.db",
    r"d:\exam-platform-starter\exam_platform.db",
    r"d:\exam-platform-starter\sql_app.db"
]

found = False
for path in db_paths:
    if os.path.exists(path):
        found = True
        print(f"\n--- Checking Database: {path} ---")
        try:
            conn = sqlite3.connect(path)
            cursor = conn.cursor()
            cursor.execute("SELECT id, email, full_name, role FROM users")
            rows = cursor.fetchall()
            for r in rows:
                print(f"ID: {r[0]} | Email: {r[1]} | Name: {r[2]} | Role: {r[3]}")
            conn.close()
        except Exception as e:
            print(f"Error querying {path}: {e}")

if not found:
    print("No local database files found.")
