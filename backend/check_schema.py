import sqlite3

def check_db(path):
    print(f"Checking {path}...")
    try:
        conn = sqlite3.connect(path)
        cursor = conn.cursor()
        cursor.execute("PRAGMA table_info(analyses)")
        columns = cursor.fetchall()
        
        found = False
        for col in columns:
            if col[1] == 'recommendation':
                found = True
        
        if found:
            print(f"SUCCESS: 'recommendation' found in {path}")
        else:
            print(f"FAILURE: 'recommendation' NOT found in {path}")
            
        conn.close()
    except Exception as e:
        print(f"Error checking {path}: {e}")

if __name__ == "__main__":
    check_db('xgproai.db')
    check_db('backend/xgproai.db')
