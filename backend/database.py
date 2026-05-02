import mysql.connector

def get_db():
    try:
        db = mysql.connector.connect(
            host="localhost",
            user="root",            # 👉 change if needed
            password="aadhu123",  # 👉 put your MySQL password
            database="campusflow2"    # 👉 IMPORTANT (your DB name)
        )
        return db

    except mysql.connector.Error as err:
        print("❌ Database connection error:", err)
        raise Exception("Database connection failed")