import os
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# ✅ CORRECT IMPORT
from backend.auth import router

app = FastAPI()

# ================= API ROUTES =================
app.include_router(router)

# ================= PATH SETUP =================
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, ".."))
FRONTEND_DIR = os.path.join(PROJECT_ROOT, "frontend")

print("PROJECT ROOT:", PROJECT_ROOT)
print("FRONTEND DIR:", FRONTEND_DIR)

# ================= SAFE FILE FUNCTION =================
def serve_file(filename):
    file_path = os.path.join(FRONTEND_DIR, filename)

    if not os.path.exists(file_path):
        return {"error": f"{filename} not found ❗"}

    return FileResponse(file_path)


# ================= SERVE HTML =================
@app.get("/")
def home():
    return serve_file("login.html")

@app.get("/login")
def login_page():
    return serve_file("login.html")

@app.get("/register")
def register_page():
    return serve_file("register.html")

@app.get("/admin")
def admin_page():
    return serve_file("admin_dashboard.html")

@app.get("/student")
def student_page():
    return serve_file("student.html")


# ================= STATIC FILES =================
app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")