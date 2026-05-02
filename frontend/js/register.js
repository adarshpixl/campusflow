const API = "http://127.0.0.1:8000";
const toastContainer = document.getElementById("toastContainer");

function showToast(message, type = "success") {
    if (!toastContainer) return;
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

async function register() {
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!name || !email || !password) {
        showToast("Fill all fields ❗", "error");
        return;
    }

    const res = await fetch(`${API}/register?name=${encodeURIComponent(name)}&email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}&role=student`, {
        method: "POST"
    });

    const data = await res.json();

    if (data.message) {
        showToast("Registered Successfully ✅", "success");
        setTimeout(() => window.location.href = "/login", 900);
    } else {
        showToast(data.error || "Registration failed ❌", "error");
    }
}