import sqlite3

conn = sqlite3.connect(r'webapp/backend/pkl_reports.db')
cursor = conn.cursor()

cursor.execute("PRAGMA table_info(users)")
cols = [row[1] for row in cursor.fetchall()]

cursor.execute(f"SELECT {', '.join(cols)} FROM users")
users = cursor.fetchall()

print("=" * 80)
print("DAFTAR AKUN / USER TERDAFTAR DI DATABASE (pkl_reports.db):")
print("=" * 80)
for u in users:
    d = dict(zip(cols, u))
    # Jangan tampilkan hash password demi keamanan
    d.pop("hashed_password", None)
    print(d)

print("\n" + "=" * 80)
print("DAFTAR DRAFT LAPORAN TERDAFTAR DI DATABASE:")
print("=" * 80)

cursor.execute("SELECT id, user_id, title, status, updated_at FROM drafts ORDER BY updated_at DESC")
drafts = cursor.fetchall()
for d in drafts:
    print(f"Draft ID: {d[0]} | User ID: {d[1]} | Judul: '{d[2]}' | Status: {d[3]} | Last Update: {d[4]}")
