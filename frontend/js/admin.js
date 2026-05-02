// ================= CONFIG =================
const API = "http://127.0.0.1:8000";

const toastContainer = document.getElementById("toastContainer");
const studentDetailPanel = document.getElementById("studentDetailPanel");
const studentDetailContent = document.getElementById("studentDetailContent");

(function () {
    const role = localStorage.getItem("user_role");
    if (role !== "admin") {
        alert("Unauthorized â— Please login as admin");
        window.location.href = "/login";
    }
})();

// ================= TOAST =================
function showToast(message, type = "success") {
    if (!toastContainer) {
        alert(message);
        return;
    }

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);

    setTimeout(() => toast.remove(), 3000);
}

// ================= RESPONSE HANDLER =================
async function handleResponse(res) {
    const text = await res.text();

    try {
        return JSON.parse(text);
    } catch {
        console.error("Server returned non-JSON:", text);
        return { error: "Server error â— Check backend" };
    }
}

// ================= ADD STUDENT =================
async function addStudent() {
    const name = s_name.value.trim();
    const email = s_email.value.trim();
    const dept = s_dept.value.trim();

    if (!name || !email || !dept) {
        showToast("Fill all fields â—", "error");
        return;
    }

    const res = await fetch(`${API}/add-student?name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&department=${encodeURIComponent(dept)}`, {
        method: "POST"
    });

    const data = await handleResponse(res);
    showToast(data.message || data.error, data.message ? "success" : "error");

    s_name.value = "";
    s_email.value = "";
    s_dept.value = "";

    loadStudents(); // refresh
}

// ================= VIEW STUDENTS =================
async function loadStudents() {
    try {
        const res = await fetch(`${API}/students`);
        const data = await handleResponse(res);

        if (data.error) {
            showToast(data.error, "error");
            return;
        }

        let html = "";

        if (data.length === 0) {
            html = `<tr><td colspan="4">No students found</td></tr>`;
        } else {
            data.forEach(s => {
                html += `
                <tr>
                    <td>${s.name}</td>
                    <td>${s.email}</td>
                    <td>${s.department}</td>
                    <td>
                        <button class="secondary-btn table-btn" onclick="viewStudent('${s.email}')">View</button>
                        <button class="danger-btn table-btn" onclick="deleteStudent('${s.email}')">Delete</button>
                    </td>
                </tr>`;
            });
        }

        document.getElementById("studentsTable").innerHTML = html;

    } catch (err) {
        console.error(err);
        showToast("Error loading students âŒ", "error");
    }
}

// ================= DELETE STUDENT =================
async function deleteStudent(email) {
    if (!confirm("Delete this student permanently? â—")) return;

    const res = await fetch(`${API}/delete-student?email=${encodeURIComponent(email)}`, {
        method: "DELETE"
    });

    const data = await handleResponse(res);
    showToast(data.message || data.error, data.message ? "success" : "error");

    loadStudents();
}

// ================= VIEW DETAILS =================
function openStudentDetails(content) {
    if (!studentDetailPanel) return;
    studentDetailContent.innerHTML = content;
    studentDetailPanel.classList.remove("hidden");
}

function closeStudentDetails() {
    if (!studentDetailPanel) return;
    studentDetailPanel.classList.add("hidden");
}

// ================= VIEW STUDENT =================
async function viewStudent(email) {
    const res = await fetch(`${API}/student-data?email=${encodeURIComponent(email)}`);
    const data = await handleResponse(res);

    if (data.error) {
        showToast(data.error, "error");
        return;
    }

    let attendance = data.attendance.length
        ? data.attendance.map(a => {
            const percent = a.total ? ((a.present / a.total) * 100).toFixed(1) : 0;
            return `<tr><td>${a.subject}</td><td>${a.total}</td><td>${a.present}</td><td>${percent}%</td></tr>`;
        }).join("")
        : `<tr><td colspan="4">No attendance</td></tr>`;

    let internals = data.internals.length
        ? data.internals.map(i => `<tr><td>${i.subject}</td><td>${i.marks}</td></tr>`).join("")
        : `<tr><td colspan="2">No marks</td></tr>`;

    openStudentDetails(`
        <h2>${email}</h2>

        <h3>Attendance</h3>
        <table>
            <tr><th>Subject</th><th>Total</th><th>Present</th><th>%</th></tr>
            ${attendance}
        </table>

        <h3>Internals</h3>
        <table>
            <tr><th>Subject</th><th>Marks</th></tr>
            ${internals}
        </table>
    `);
}

// ================= ADMIN NOTIFICATION MODAL =================
function showAdminNotification(title, body, meta = "") {
    const modal = document.getElementById("adminNotificationModal");
    if (!modal) return;

    const titleEl = document.getElementById("adminNotificationTitle") || modal.querySelector("h2");
    const bodyEl = document.getElementById("adminNotificationBody");
    const metaEl = document.getElementById("adminNotificationMeta");

    if (titleEl) titleEl.textContent = title;
    if (bodyEl) bodyEl.textContent = body;
    if (metaEl) metaEl.textContent = meta;

    modal.style.display = "flex";
}

function closeAdminNotification() {
    const modal = document.getElementById("adminNotificationModal");
    if (modal) modal.style.display = "none";
}

async function getStudentCount() {
    try {
        const studentRes = await fetch(`${API}/students`);
        const students = await handleResponse(studentRes);
        return Array.isArray(students) ? students.length : null;
    } catch (err) {
        console.error("Error getting student count:", err);
        return null;
    }
}

function formatStudentCount(count) {
    if (count === null) return "Students notified by email";
    return `${count} student${count === 1 ? "" : "s"} notified by email`;
}

// ================= ADD ASSIGNMENT =================
async function addAssignment() {
    const title = a_title.value.trim();
    const desc = a_desc.value.trim();
    const date = a_date.value.trim();

    if (!title || !desc || !date) {
        showToast("Fill all fields â—", "error");
        return;
    }

    const res = await fetch(`${API}/add-assignment?title=${encodeURIComponent(title)}&description=${encodeURIComponent(desc)}&due_date=${date}`, {
        method: "POST"
    });

    const data = await handleResponse(res);
    
    if (data.message) {
        showToast("âœ… Assignment created! Notifying all registered students...", "success");
        
        const studentCount = await getStudentCount();
        showAdminNotification(
            "Assignment posted successfully",
            "A polished assignment email notification has been sent to all registered students.",
            formatStudentCount(studentCount)
        );
    } else {
        showToast(data.error || "Error creating assignment", "error");
    }

    a_title.value = "";
    a_desc.value = "";
    a_date.value = "";
    
    loadAssignments();
}

// ================= DELETE ASSIGNMENT =================
async function deleteAssignment(title) {
    if (!confirm("Delete assignment?")) return;

    const res = await fetch(`${API}/delete-assignment?title=${encodeURIComponent(title)}`, {
        method: "DELETE"
    });

    const data = await handleResponse(res);
    showToast(data.message || data.error);

    loadAssignments();
}

// ================= LOAD ASSIGNMENTS =================
async function loadAssignments() {
    try {
        const res = await fetch(`${API}/assignments`);
        const data = await handleResponse(res);

        if (data.error) {
            showToast(data.error, "error");
            return;
        }

        const list = document.getElementById("assignmentList");
        if (!list) return;

        if (!data.length) {
            list.innerHTML = "<li class='empty'>No assignments found.</li>";
            return;
        }

        list.innerHTML = data.map(item => `
            <li class="announcement-item">
                <div class="announcement-header">
                    <div>
                        <strong>${item.title}</strong>
                        <p>Due: ${item.due_date}</p>
                    </div>
                    <button class="danger-btn small-btn" onclick="deleteAssignment('${item.title.replace(/'/g, "\\'")}')">Delete</button>
                </div>
                <p>${item.description}</p>
            </li>
        `).join("");
    } catch (err) {
        console.error(err);
        showToast("Error loading assignments âŒ", "error");
    }
}

// ================= ATTENDANCE =================
async function markAttendance() {
    const email = att_email.value.trim();
    const subject = att_sub.value.trim();
    const status = att_status.value.trim().toLowerCase();

    if (!email || !subject || !status) {
        showToast("Fill all fields â—", "error");
        return;
    }

    const res = await fetch(`${API}/mark-attendance?student_email=${encodeURIComponent(email)}&subject=${encodeURIComponent(subject)}&status=${encodeURIComponent(status)}`, {
        method: "POST"
    });

    const data = await handleResponse(res);
    showToast(data.message || data.error);
}

// ================= INTERNAL =================
async function addInternal() {
    const email = int_email.value.trim();
    const subject = int_sub.value.trim();
    const marks = int_marks.value.trim();

    if (!email || !subject || !marks) {
        showToast("Fill all fields â—", "error");
        return;
    }

    const res = await fetch(`${API}/add-internal?student_email=${encodeURIComponent(email)}&subject=${encodeURIComponent(subject)}&marks=${encodeURIComponent(marks)}`, {
        method: "POST"
    });

    const data = await handleResponse(res);
    if (data.message) {
        showToast("Internal marks saved successfully", "success");
        showAdminNotification(
            "Message sent successfully",
            `A detailed internal marks email has been sent to ${email}.`,
            `${subject}: ${marks}/25`
        );
    } else {
        showToast(data.error || "Error saving marks", "error");
    }
}

// ================= ANNOUNCEMENT =================
async function sendMessage() {
    const title = msg_title.value.trim();
    const message = msg_body.value.trim();

    if (!title || !message) {
        showToast("Fill all fields â—", "error");
        return;
    }

    const res = await fetch(`${API}/add-message?title=${encodeURIComponent(title)}&message=${encodeURIComponent(message)}`, {
        method: "POST"
    });

    const data = await handleResponse(res);
    if (data.message) {
        const studentCount = await getStudentCount();
        showToast("Announcement sent successfully", "success");
        showAdminNotification(
            "Message sent successfully",
            "Your announcement email has been sent to all registered students.",
            formatStudentCount(studentCount)
        );
        msg_title.value = "";
        msg_body.value = "";
    } else {
        showToast(data.error || "Error sending announcement", "error");
    }

    loadAnnouncements();
}

// ================= LOAD ANNOUNCEMENTS =================
async function loadAnnouncements() {
    try {
        const res = await fetch(`${API}/messages`);
        const data = await handleResponse(res);

        if (data.error) {
            showToast(data.error, "error");
            return;
        }

        const list = document.getElementById("announcementList");
        if (!list) return;

        if (!data.length) {
            list.innerHTML = "<li class='empty'>No announcements yet.</li>";
            return;
        }

        list.innerHTML = data.map(item => `
            <li class="announcement-item">
                <div class="announcement-header">
                    <div>
                        <strong>${item.title}</strong>
                        <p>${new Date(item.date).toLocaleString()}</p>
                    </div>
                    <button class="danger-btn small-btn" onclick="deleteAnnouncement(${item.id})">Delete</button>
                </div>
                <p>${item.message}</p>
            </li>
        `).join("");
    } catch (err) {
        console.error(err);
        showToast("Error loading announcements âŒ", "error");
    }
}

// ================= DELETE ANNOUNCEMENT =================
async function deleteAnnouncement(id) {
    if (!confirm("Delete this announcement?")) return;

    const res = await fetch(`${API}/delete-message?message_id=${id}`, {
        method: "DELETE"
    });

    const data = await handleResponse(res);
    showToast(data.message || data.error);

    loadAnnouncements();
}

// ================= LOGOUT =================
function logout() {
    localStorage.clear();
    window.location.href = "/login";
}

// ================= INIT =================
window.onload = () => {
    loadStudents();
    loadAssignments();
    loadAnnouncements();
};
