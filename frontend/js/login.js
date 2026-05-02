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

async function login() {
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    if (!email || !password) {
        showToast("Fill all fields ❗", "error");
        return;
    }

    try {
        const res = await fetch(`${API}/login?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`, {
            method: "POST"
        });

        const data = await res.json();

        if (data.message === "Login successful") {
            showToast("Login successful ✅", "success");
            localStorage.setItem("user_email", data.email);
            localStorage.setItem("user_role", data.role);

            setTimeout(() => {
                if (data.role === "admin") {
                    window.location.href = "/admin";
                } else {
                    window.location.href = "/student";
                }
            }, 900);

        } else {
            showToast(data.error || data.message || "Login failed ❌", "error");
        }

    } catch (err) {
        console.error(err);
        showToast("Server error ❌", "error");
    }
}