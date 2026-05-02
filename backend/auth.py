from fastapi import APIRouter, BackgroundTasks
from backend.database import get_db  # âœ… FIXED IMPORT
from typing import cast
import smtplib
from email.mime.text import MIMEText

router = APIRouter()

# =========================
# ðŸ“§ EMAIL FUNCTION
# =========================
def send_email(to_email, subject, body):
    try:
        sender_email = "campusflow15@gmail.com"
        app_password = "hrsl ndef qxbk ujzq"

        msg = MIMEText(body, "plain", "utf-8")
        msg["Subject"] = subject
        msg["From"] = sender_email
        msg["To"] = to_email

        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(sender_email, app_password)
        server.sendmail(sender_email, to_email, msg.as_string())
        server.quit()

    except Exception as e:
        print("Email Error:", e)

def send_bulk_emails(emails, subject, body):
    for email in emails:
        send_email(email, subject, body)


def assignment_email_body(title: str, description: str, due_date: str) -> str:
    return f"""Hello Student,

A new assignment has been posted in Campus Flow.

Assignment: {title}
Due date: {due_date}

Details:
{description}

Please review the assignment from your student dashboard and plan your submission before the due date.

Regards,
Campus Flow Admin Team"""


def announcement_email_body(title: str, message: str) -> str:
    return f"""Hello Student,

A new announcement has been shared in Campus Flow.

Title: {title}

Message:
{message}

Please check your student dashboard for the latest updates.

Regards,
Campus Flow Admin Team"""


def internal_marks_email_body(subject: str, marks: int) -> str:
    return f"""Hello Student,

Your internal marks have been updated in Campus Flow.

Subject: {subject}
Marks scored: {marks}/25

Please log in to your student dashboard to review your academic record. If you think the marks need correction, contact your faculty or department admin.

Regards,
Campus Flow Admin Team"""


def attendance_email_body(subject: str, status: str) -> str:
    status_text = "Present" if status == "present" else "Absent"
    note = "Thank you for attending the class." if status == "present" else "Please contact your faculty if this was marked by mistake."

    return f"""Hello Student,

Your attendance has been recorded in Campus Flow.

Subject: {subject}
Status: {status_text}

{note}

Regards,
Campus Flow Admin Team"""


# =========================
# âœ… REGISTER
# =========================
@router.post("/register")
def register(name: str, email: str, password: str, role: str):
    if role != "student":
        return {"error": "Only students can register"}

    db = get_db()
    cur = db.cursor()

    cur.execute("SELECT * FROM users WHERE email=%s", (email,))
    if cur.fetchone():
        return {"error": "Email already exists"}

    cur.execute(
        "INSERT INTO users (name, email, password, role) VALUES (%s, %s, %s, %s)",
        (name, email, password, role)
    )
    db.commit()

    cur.close()
    db.close()

    return {"message": "User registered successfully"}


# =========================
# âœ… LOGIN
# =========================
@router.post("/login")
def login(email: str, password: str):
    db = get_db()
    cur = db.cursor()

    cur.execute(
        "SELECT * FROM users WHERE email=%s AND password=%s",
        (email, password)
    )

    user = cur.fetchone()

    cur.close()
    db.close()

    if user:
        user_tuple = cast(tuple, user)
        return {
            "message": "Login successful",
            "role": user_tuple[4],
            "email": user_tuple[2]
        }

    return {"error": "Invalid email or password"}


# =========================
# ðŸ‘¨â€ðŸ’¼ ADD STUDENT
# =========================
@router.post("/add-student")
def add_student(name: str, email: str, department: str):
    db = get_db()
    cur = db.cursor()

    cur.execute("SELECT * FROM students WHERE email=%s", (email,))
    if cur.fetchone():
        return {"error": "Student already exists"}

    cur.execute(
        "INSERT INTO students (name, email, department) VALUES (%s, %s, %s)",
        (name, email, department)
    )
    db.commit()

    cur.close()
    db.close()

    return {"message": "Student added successfully"}


# =========================
# ðŸ“‹ VIEW STUDENTS
# =========================
@router.get("/students")
def get_students():
    db = get_db()
    cur = db.cursor(dictionary=True)

    cur.execute("SELECT name, email, department FROM students")
    students = cur.fetchall()

    cur.close()
    db.close()

    return students


# =========================
# âŒ DELETE STUDENT
# =========================
# ================= DELETE STUDENT =================
@router.delete("/delete-student")
def delete_student(email: str):
    db = get_db()
    cur = db.cursor()

    try:
        # ðŸ”¥ delete related data first (IMPORTANT)
        cur.execute("DELETE FROM attendance WHERE student_email=%s", (email,))
        cur.execute("DELETE FROM internals WHERE student_email=%s", (email,))
        cur.execute("DELETE FROM students WHERE email=%s", (email,))
        cur.execute("DELETE FROM users WHERE email=%s", (email,))

        db.commit()

        return {"message": "Student deleted successfully âœ…"}

    except Exception as e:
        return {"error": str(e)}

    finally:
        cur.close()
        db.close()

# =========================
# ðŸ“Œ ADD ASSIGNMENT
# =========================
@router.post("/add-assignment")
def add_assignment(title: str, description: str, due_date: str, background: BackgroundTasks):
    db = get_db()
    cur = db.cursor()

    try:
        cur.execute(
            "INSERT INTO assignments (title, description, due_date) VALUES (%s, %s, %s)",
            (title, description, due_date)
        )
        db.commit()

        cur.execute("SELECT email FROM users WHERE role='student'")
        students = cur.fetchall()

        student_emails = [cast(tuple, s)[0] for s in students]

        background.add_task(
            send_bulk_emails,
            student_emails,
            f"New Assignment: {title}",
            assignment_email_body(title, description, due_date)
        )

        return {"message": "Assignment added + Email sent"}

    except Exception as e:
        return {"error": str(e)}

    finally:
        cur.close()
        db.close()


# =========================
# âŒ DELETE ASSIGNMENT
# =========================
@router.delete("/delete-assignment")
def delete_assignment(title: str):
    db = get_db()
    cur = db.cursor()

    cur.execute("SELECT * FROM assignments WHERE title=%s", (title,))
    if not cur.fetchone():
        return {"error": "Assignment not found"}

    cur.execute("DELETE FROM assignments WHERE title=%s", (title,))
    db.commit()

    cur.close()
    db.close()

    return {"message": "Assignment deleted successfully"}


# =========================
# ï¿½ ASSIGNMENT LIST
@router.get("/assignments")
def get_assignments():
    db = get_db()
    cur = db.cursor(dictionary=True)

    cur.execute("SELECT title, description, due_date FROM assignments ORDER BY due_date ASC")
    assignments = cur.fetchall()

    cur.close()
    db.close()

    return assignments


# =========================
# ï¿½ðŸ“Š ATTENDANCE
# =========================
@router.post("/mark-attendance")
def mark_attendance(student_email: str, subject: str, status: str, background: BackgroundTasks):
    db = get_db()
    cur = db.cursor()

    if status not in ["present", "absent"]:
        return {"error": "Invalid status"}

    cur.execute(
        "INSERT INTO attendance (student_email, subject, status, date) VALUES (%s, %s, %s, CURDATE())",
        (student_email, subject, status)
    )
    db.commit()

    subject_text = "Attendance Alert" if status == "absent" else "Attendance Recorded"
    body_text = attendance_email_body(subject, status)
    background.add_task(send_email, student_email, subject_text, body_text)

    cur.close()
    db.close()

    return {"message": "Attendance marked successfully"}


# =========================
# ðŸŽ¯ INTERNAL MARKS
# =========================
@router.post("/add-internal")
def add_internal(student_email: str, subject: str, marks: int, background: BackgroundTasks):
    db = get_db()
    cur = db.cursor()

    if marks < 0 or marks > 25:
        return {"error": "Marks must be 0-25"}

    cur.execute(
        "REPLACE INTO internals (student_email, subject, marks) VALUES (%s, %s, %s)",
        (student_email, subject, marks)
    )
    db.commit()

    background.add_task(
        send_email,
        student_email,
        f"Internal Marks Updated: {subject}",
        internal_marks_email_body(subject, marks)
    )

    cur.close()
    db.close()

    return {"message": "Internal marks saved successfully"}


# =========================
# ðŸ“¢ ADD MESSAGE
# =========================
@router.post("/add-message")
def add_message(title: str, message: str, background: BackgroundTasks):
    db = get_db()
    cur = db.cursor()

    cur.execute(
        "INSERT INTO messages (title, message, date) VALUES (%s, %s, NOW())",
        (title, message)
    )
    db.commit()

    cur.execute("SELECT email FROM users WHERE role='student'")
    students = cur.fetchall()

    student_emails = [cast(tuple, s)[0] for s in students]

    cur.close()
    db.close()

    background.add_task(
        send_bulk_emails,
        student_emails,
        f"Announcement: {title}",
        announcement_email_body(title, message)
    )

    return {"message": "Announcement sent successfully"}


# =========================
# ðŸ“¢ GET MESSAGES
# =========================
@router.get("/messages")
def get_messages():
    db = get_db()
    cur = db.cursor(dictionary=True)

    cur.execute("SELECT * FROM messages ORDER BY date DESC")
    data = cur.fetchall()

    cur.close()
    db.close()

    return data


# =========================
# ðŸ—‘ï¸ DELETE MESSAGE
@router.delete("/delete-message")
def delete_message(message_id: int):
    db = get_db()
    cur = db.cursor()

    cur.execute("SELECT * FROM messages WHERE id=%s", (message_id,))
    if not cur.fetchone():
        cur.close()
        db.close()
        return {"error": "Announcement not found"}

    cur.execute("DELETE FROM messages WHERE id=%s", (message_id,))
    db.commit()

    cur.close()
    db.close()

    return {"message": "Announcement deleted successfully"}


# =========================
# ðŸŽ“ STUDENT DATA
# =========================
@router.get("/student-data")
def get_student_data(email: str):
    db = get_db()
    cur = db.cursor(dictionary=True)

    cur.execute("""
        SELECT subject,
        COUNT(*) as total,
        SUM(CASE WHEN status='present' THEN 1 ELSE 0 END) as present
        FROM attendance
        WHERE student_email=%s
        GROUP BY subject
    """, (email,))
    attendance = cur.fetchall()

    cur.execute("""
        SELECT subject, MAX(marks) as marks
        FROM internals
        WHERE student_email=%s
        GROUP BY subject
    """, (email,))
    internals = cur.fetchall()

    cur.execute("SELECT title, description, due_date FROM assignments ORDER BY due_date ASC")
    assignments = cur.fetchall()

    cur.execute("SELECT * FROM messages ORDER BY date DESC")
    messages = cur.fetchall()

    cur.close()
    db.close()

    return {
        "attendance": attendance or [],
        "internals": internals or [],
        "messages": messages or [],
        "assignments": assignments or []
    }
