// Set to true ONLY for frontend testing without backend
const MOCK_MODE = false;

// Optional mock for offline testing
if (typeof window !== "undefined" && MOCK_MODE) {
  const originalFetch = window.fetch;
  window.fetch = async function(url, options) {
    if (url.includes("/api/submit-absence")) {
      await new Promise(r => setTimeout(r, 500));
      return { json: async () => ({ success: true }) };
    }
    if (url.includes("/api/requests")) {
      return {
        json: async () => [
          { Name: "John Doe", ID: 101, Startdate: "2026-07-01", Enddate: "2026-07-05", Status: "Pending", Reason: "Family vacation" }
        ]
      };
    }
    return originalFetch.apply(this, arguments);
  };
}

document.addEventListener("DOMContentLoaded", () => {
  // =============== LOGIN HANDLER ===============
  const loginBtn = document.querySelector(".signin");
  if (loginBtn) {
    loginBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const user = document.getElementById("username").value;
      const pass = document.getElementById("password").value;

      if (user === "admin" && pass === "123") {
// i removed the alert it egt annoying. -zaim
        document.getElementById("LoginForm").classList.add("hidden");
        document.getElementById("container1").classList.remove("hidden");
        document.getElementById("ReqFormReview").classList.remove("hidden"); // Show preview
        loadRequestData(); // ← LOAD DATA HERE!
      } else {
        alert("Invalid credentials.");
      }
    });
  }

  // =============== FORM SUBMISSION ===============
  const form = document.getElementById("absenceRequestForm");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = {
        employeeName: document.getElementById("employeeName").value,
        employeeId: document.getElementById("employeeId").value,
        employeeEmail: document.getElementById("EmployeeEmail").value,
        startDate: document.getElementById("startDate").value,
        endDate: document.getElementById("endDate").value,
        absenceType: document.getElementById("absenceType").value,
        reason: document.getElementById("reason").value
      };

      try {
        const res = await fetch("http://localhost:3000/api/submit-absence", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });

        const result = await res.json();
        if (result.success) {
          alert("Request submitted! Check 'My Requests' below.");
          form.reset();
          loadRequestData(); // Refresh table after submit
        } else {
          alert("Error: " + result.error);
        }
      } catch (err) {
        alert("Server unreachable. Is Node.js running?");
      }
    });
  }
});

// =============== LOAD REQUESTS FROM SERVER ===============
async function loadRequestData() {
  const tbody = document.getElementById("requestTableBody");
  if (!tbody) return;

  try {
    const res = await fetch("http://localhost:3000/api/requests");
    const requests = await res.json();

    tbody.innerHTML = "";
    if (requests.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6">No requests found.</td></tr>`;
      return;
    }

    requests.forEach(req => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${escapeHtml(req.Name)}</td>
        <td>${req.ID}</td>
        <td>${req.Startdate}</td>
        <td>${req.Enddate}</td>
        <td>${req.Status || 'Pending'}</td>
        <td>${escapeHtml(req.Reason)}</td>
      `;
      tbody.appendChild(row);
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6">Failed to load data.</td></tr>`;
  }
}

// Prevent XSS by escaping HTML
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}