import sqlite3
import os

def check_db(file_path):
    if not os.path.exists(file_path):
        return
    print(f"\nChecking: {file_path} (size: {os.path.getsize(file_path)} bytes)")
    try:
        conn = sqlite3.connect(file_path)
        c = conn.cursor()
        c.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = c.fetchall()
        print("Tables:", tables)
        for t in tables:
            tname = t[0]
            if tname == 'users':
                c.execute("SELECT id, email, full_name, role FROM users")
                users = c.fetchall()
                print("USERS:", users)
        conn.close()
    except Exception as e:
        print("Error:", e)

for root, dirs, files in os.walk(r"d:\exam-platform-starter"):
    for f in files:
        if f.endswith('.db') or f.endswith('.sqlite') or f.endswith('.sqlite3'):
            check_db(os.path.join(root, f))
