import sqlite3
import os
from app.security import verify_password

db_paths = [
    'webapp/backend/data/pkl_reports.db',
    'webapp/backend/pkl_reports.db',
    '/app/webapp/backend/data/pkl_reports.db',
    '/app/webapp/backend/pkl_reports.db',
]

db_file = None
for p in db_paths:
    if os.path.exists(p):
        db_file = p
        break

if not db_file:
    print("❌ Database tidak ditemukan di lokasi manapun.")
    exit(1)

print(f"📦 Menggunakan Database: {db_file}")

conn = sqlite3.connect(db_file)
cursor = conn.cursor()

cursor.execute("PRAGMA table_info(users)")
cols = [row[1] for row in cursor.fetchall()]

cursor.execute(f"SELECT {', '.join(cols)} FROM users")
users = cursor.fetchall()

print("=" * 80)
print("DAFTAR AKUN / USER TERDAFTAR DI DATABASE:")
print("=" * 80)
for u in users:
    d = dict(zip(cols, u))
    pwd_hash = d.pop("password_hash", None)
    pwd_ok = verify_password("password123", pwd_hash) if pwd_hash else False
    print(f"ID: {d.get('id')} | Email: {d.get('email')} | Nama: {d.get('name')} | Pass 'password123' Valid: {pwd_ok}")

print("\n" + "=" * 80)
print("DAFTAR DRAFT LAPORAN TERDAFTAR DI DATABASE:")
print("=" * 80)

cursor.execute("SELECT id, user_id, title, status, updated_at FROM drafts ORDER BY updated_at DESC")
drafts = cursor.fetchall()
for d in drafts:
    print(f"Draft ID: {d[0]} | User ID: {d[1]} | Judul: '{d[2]}' | Status: {d[3]} | Last Update: {d[4]}")
