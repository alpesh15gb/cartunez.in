import sqlite3
import datetime

conn = sqlite3.connect(r'C:\Users\alpes\.local\share\mimocode\mimocode.db')
c = conn.cursor()

# Get actual user sessions for cartunez project (exclude subagent sessions)
c.execute("""
    SELECT id, title, datetime(time_created/1000, 'unixepoch', 'localtime') as created,
           datetime(time_updated/1000, 'unixepoch', 'localtime') as updated
    FROM session
    WHERE directory = 'C:\\cartunez'
    AND title NOT LIKE 'checkpoint-writer:%'
    AND title NOT LIKE 'Auto Dream%'
    ORDER BY time_created DESC
    LIMIT 15
""")
print("=== RECENT CARTUNEZ USER SESSIONS ===")
for r in c.fetchall():
    print(r)

# Count total messages per session for these sessions
c.execute("""
    SELECT s.id, s.title, COUNT(m.id) as msg_count,
           datetime(s.time_created/1000, 'unixepoch', 'localtime') as created
    FROM session s
    JOIN message m ON m.session_id = s.id
    WHERE s.directory = 'C:\\cartunez'
    AND s.title NOT LIKE 'checkpoint-writer:%'
    AND s.title NOT LIKE 'Auto Dream%'
    GROUP BY s.id
    ORDER BY s.time_created DESC
    LIMIT 15
""")
print("\n=== SESSION MESSAGE COUNTS ===")
for r in c.fetchall():
    print(r)

conn.close()
