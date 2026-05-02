# 🎓 Campus Flow – DBMS Mini Project

## 📌 Project Overview
Campus Flow is a full-stack web application designed to manage student academic data such as attendance, internal marks, assignments, and announcements.

It provides:
- 👨‍💼 Admin Dashboard (manage everything)
- 🎓 Student Dashboard (view data)

---

## 🚀 Features

### 👨‍💼 Admin
- Add / View / Delete students
- Create & delete assignments
- Mark attendance (present / absent)
- Add internal marks
- Send announcements
- View student details

### 🎓 Student
- View attendance percentage
- View internal marks
- View assignments
- View announcements

### 🔐 Authentication
- Login system (Admin / Student roles)
- Role-based access control

---

## 🛠️ Tech Stack

- Frontend: HTML, CSS, JavaScript  
- Backend: FastAPI (Python)  
- Database: MySQL  
- Server: Uvicorn  

---

## 🗄️ Database Tables

- users → login data  
- students → student details  
- attendance → attendance records  
- internals → marks  
- assignments → assignments  
- messages → announcements  

---

## ⚙️ Setup Instructions

### 1. Clone Project
```bash
git clone <your-repo-link>
cd campus-flow
