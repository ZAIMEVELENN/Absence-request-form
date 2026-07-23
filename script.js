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
          { Name: "John Doe", ID: 101, Startdate: "2026-07-01", Enddate: "2026-07-05", Status: "Pending", Reason: "Family vacation" },
          { Name: "Jane Smith", ID: 102, Startdate: "2026-08-01", Enddate: "2026-08-05", Status: "Approved", Reason: "Medical leave" }
        ]
      };
    }
    return originalFetch.apply(this, arguments);
  };
}

// =============== DATA STRUCTURE ===============
// We use an Array of Objects to store our requests in memory. 
// This serves as our primary data structure for the search algorithm.
let requestDataStructure = [];
const reviewRoles = ["CEO", "HR", "MANAGER"];

document.addEventListener("DOMContentLoaded", () => {
  if (window.location.pathname.includes("reqboard.html")) {
      loadRequestData();
  }

  if (window.location.pathname.includes("request-review.html")) {
      loadReviewRequests();
  }
  // =============== LOGIN HANDLER ===============
  const loginBtn = document.querySelector(".signin");
  const loginFormDiv = document.getElementById("LoginForm");
  const signupFormDiv = document.getElementById("SignupBTN");
  const signupBtn = document.querySelector(".signup");

  // Check persistent login session on page load
  const currentUser = getCurrentUser();
  if (currentUser) {
    if (loginFormDiv) loginFormDiv.classList.add("hidden");
    const container1 = document.getElementById("container1");
    if (container1) container1.classList.remove("hidden");
    const reqReview = document.getElementById("ReqFormReview");
    if (reqReview) reqReview.classList.remove("hidden");

    const badge = document.getElementById("user-badge");
    const badgeName = document.getElementById("user-badge-name");
    const badgeRole = document.getElementById("user-badge-role");
    if (badge && badgeName && badgeRole) {
      badgeName.textContent = currentUser.username;
      badgeRole.textContent = currentUser.role;
      badgeRole.className = "role-tag role-" + (currentUser.role || "EMPLOYEE").toLowerCase();
      badge.classList.remove("hidden");
    }

    applyRolePermissions(currentUser);
    autofillUserData(currentUser);
  }

  // Universal Logout Handler
  document.querySelectorAll("#logoutBtn, .logout-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("currentUser");
      window.location.href = "index.html";
    });
  });

  if (loginBtn) {
    loginBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      const username = document.getElementById("username").value.trim();
      const password = document.getElementById("password").value;
      const loginError = document.getElementById("login-error");

      // Clear any previous error
      if (loginError) loginError.classList.add("hidden");

      // Show loading state on button
      loginBtn.disabled = true;
      loginBtn.textContent = "Checking...";

      try {
        const res = await fetch("http://localhost:3000/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password })
        });

        const result = await res.json();

        if (!result.success) {
          if (loginError) {
            loginError.textContent = "\u274c " + (result.error || "Invalid username or password");
            loginError.classList.remove("hidden");
          }
          const loginUser = document.querySelector(".Loginuser");
          if (loginUser) {
            loginUser.classList.add("shake");
            setTimeout(() => loginUser.classList.remove("shake"), 500);
          }
          loginBtn.disabled = false;
          loginBtn.textContent = " Log in";
          return;
        }

        localStorage.setItem("currentUser", JSON.stringify(result.user));

        if (loginFormDiv) loginFormDiv.classList.add("hidden");
        const container1 = document.getElementById("container1");
        if (container1) container1.classList.remove("hidden");
        const reqReview = document.getElementById("ReqFormReview");
        if (reqReview) reqReview.classList.remove("hidden");

        const badge = document.getElementById("user-badge");
        const badgeName = document.getElementById("user-badge-name");
        const badgeRole = document.getElementById("user-badge-role");
        if (badge && badgeName && badgeRole) {
          badgeName.textContent = result.user.username;
          badgeRole.textContent = result.user.role;
          badgeRole.className = "role-tag role-" + result.user.role.toLowerCase();
          badge.classList.remove("hidden");
        }

        applyRolePermissions(result.user);
        autofillUserData(result.user);
      } catch (err) {
        // Presentation Fallback: Allow quick demonstration offline if server is offline
        const mockAccounts = {
          zaimevelenn: { id: 1, username: 'zaimevelenn', email: 'zaimevelenn@zilk-atelier.com', role: 'CEO', branch: 'ALL' },
          ceo: { id: 1, username: 'CEO_Admin', email: 'ceo@zilk-atelier.com', role: 'CEO', branch: 'ALL' },
          hr: { id: 2, username: 'HR_Head', email: 'hr@zilk-atelier.com', role: 'HR', branch: 'ALL' },
          manager: { id: 3, username: 'PhnomPenh_Mgr', email: 'manager@zilk-atelier.com', role: 'MANAGER', branch: 'Phnom Penh' },
          john: { id: 101, username: 'john', email: 'john@zilk-atelier.com', role: 'EMPLOYEE', branch: 'Phnom Penh' }
        };
        const fallbackUser = mockAccounts[username.toLowerCase()] || { id: 99, username: username || 'User', email: (username || 'user').toLowerCase() + '@zilk-atelier.com', role: 'EMPLOYEE', branch: 'Phnom Penh' };
        localStorage.setItem("currentUser", JSON.stringify(fallbackUser));

        if (loginFormDiv) loginFormDiv.classList.add("hidden");
        const container1 = document.getElementById("container1");
        if (container1) container1.classList.remove("hidden");

        const badge = document.getElementById("user-badge");
        const badgeName = document.getElementById("user-badge-name");
        const badgeRole = document.getElementById("user-badge-role");
        if (badge && badgeName && badgeRole) {
          badgeName.textContent = fallbackUser.username;
          badgeRole.textContent = fallbackUser.role;
          badgeRole.className = "role-tag role-" + fallbackUser.role.toLowerCase();
          badge.classList.remove("hidden");
        }

        applyRolePermissions(fallbackUser);
        autofillUserData(fallbackUser);
        loginBtn.disabled = false;
        loginBtn.textContent = " Log in";
      }
    });
  }

  // Signup Form View Toggle
  const backToLoginBtn = document.getElementById("backToLogin");
  if (signupBtn && loginFormDiv && signupFormDiv) {
    signupBtn.addEventListener("click", (e) => {
      e.preventDefault();
      loginFormDiv.classList.add("hidden");
      signupFormDiv.classList.remove("hidden");
    });
  }

  if (backToLoginBtn && loginFormDiv && signupFormDiv) {
    backToLoginBtn.addEventListener("click", (e) => {
      e.preventDefault();
      signupFormDiv.classList.add("hidden");
      loginFormDiv.classList.remove("hidden");
    });
  }

  // Signup Submit Handler
  const submitSignupBtn = document.getElementById("submitSignupBtn");
  if (submitSignupBtn) {
    submitSignupBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      const username = document.getElementById("signupUsername") ? document.getElementById("signupUsername").value.trim() : "";
      const email = document.getElementById("signupEmail") ? document.getElementById("signupEmail").value.trim() : "";
      const password = document.getElementById("signupPassword") ? document.getElementById("signupPassword").value : "";
      const signupMsg = document.getElementById("signup-msg");

      if (!username || !password) {
        if (signupMsg) {
          signupMsg.textContent = "❌ Please enter a username and password.";
          signupMsg.classList.remove("hidden");
        }
        return;
      }

      submitSignupBtn.disabled = true;
      submitSignupBtn.textContent = "Creating...";

      try {
        const res = await fetch("http://localhost:3000/api/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, email, password })
        });

        const result = await res.json();
        if (!result.success) {
          if (signupMsg) {
            signupMsg.textContent = "❌ " + (result.error || "Failed to create account.");
            signupMsg.classList.remove("hidden");
          }
          submitSignupBtn.disabled = false;
          submitSignupBtn.textContent = "Create Account";
          return;
        }

        alert("Account created successfully! Logging you in...");
        localStorage.setItem("currentUser", JSON.stringify(result.user));

        if (signupFormDiv) signupFormDiv.classList.add("hidden");
        if (loginFormDiv) loginFormDiv.classList.add("hidden");

        const container1 = document.getElementById("container1");
        if (container1) container1.classList.remove("hidden");

        const badge = document.getElementById("user-badge");
        const badgeName = document.getElementById("user-badge-name");
        const badgeRole = document.getElementById("user-badge-role");
        if (badge && badgeName && badgeRole) {
          badgeName.textContent = result.user.username;
          badgeRole.textContent = result.user.role;
          badgeRole.className = "role-tag role-" + result.user.role.toLowerCase();
          badge.classList.remove("hidden");
        }

        applyRolePermissions(result.user);
        autofillUserData(result.user);

      } catch (err) {
        // Presentation Fallback offline mode
        const newId = Math.floor(100 + Math.random() * 900);
        const newUser = {
          id: newId,
          username,
          email: email || `${username.toLowerCase()}@zilk-atelier.com`,
          role: "EMPLOYEE",
          branch: "Phnom Penh"
        };
        localStorage.setItem("currentUser", JSON.stringify(newUser));

        alert("Account created successfully (Fallback)! Logging you in...");
        if (signupFormDiv) signupFormDiv.classList.add("hidden");
        if (loginFormDiv) loginFormDiv.classList.add("hidden");

        const container1 = document.getElementById("container1");
        if (container1) container1.classList.remove("hidden");

        const badge = document.getElementById("user-badge");
        const badgeName = document.getElementById("user-badge-name");
        const badgeRole = document.getElementById("user-badge-role");
        if (badge && badgeName && badgeRole) {
          badgeName.textContent = newUser.username;
          badgeRole.textContent = newUser.role;
          badgeRole.className = "role-tag role-employee";
          badge.classList.remove("hidden");
        }

        applyRolePermissions(newUser);
        autofillUserData(newUser);
      } finally {
        submitSignupBtn.disabled = false;
        submitSignupBtn.textContent = "Create Account";
      }
    });
  }

  // =============== SEARCH FUNCTIONALITY ===============
  const searchInput = document.getElementById("search");
  const searchCategory = document.getElementById("searchCategory");

  // Centralized function to handle search logic
  function performSearch() {
    const query = searchInput ? searchInput.value.trim() : "";
    const category = searchCategory ? searchCategory.value : 'all';
    const isReviewPage = window.location.pathname.includes("request-review.html");
    
    if (query === "") {
      if (isReviewPage) {
        renderReviewTable(requestDataStructure);
      } else {
        renderTable(requestDataStructure);
      }
    } else {
      // Pass the selected category into our algorithm
      const filteredData = linearSearch(requestDataStructure, query, category);
      if (isReviewPage) {
        renderReviewTable(filteredData);
      } else {
        renderTable(filteredData);
      }
    }
  }

  // Trigger search when user types in the input box
  if (searchInput) {
    searchInput.addEventListener("input", performSearch);
  }

  // Trigger search when user changes the dropdown category
  if (searchCategory) {
    searchCategory.addEventListener("change", performSearch);
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
          autofillUserData(getCurrentUser());
          loadRequestData(); // Refresh table after submit
        } else {
          alert("Error: " + result.error);
        }
      } catch (err) {
        alert("Server unreachable. Is Node.js running?");
      }
    });
  }

  const reviewTableBody = document.getElementById("reviewTableBody");
  if (reviewTableBody) {
    reviewTableBody.addEventListener("click", async (e) => {
      const actionButton = e.target.closest("button[data-action]");
      if (!actionButton) return;

      const requestId = actionButton.dataset.requestId;
      const action = actionButton.dataset.action;
      await updateRequestStatus(requestId, action);
    });

    reviewTableBody.addEventListener("change", async (e) => {
      const statusSelect = e.target.closest(".request-status-select");
      if (!statusSelect || !statusSelect.value) return;

      await updateRequestStatus(statusSelect.dataset.requestId, statusSelect.value);
    });
  }
});

// =============== ROLE PERMISSIONS ===============
//
//  Permission Matrix:
//  ┌──────────────┬──────────────┬─────────────────┬───────────┐
//  │ Role         │ Request Form │ My Requests     │ Dashboard │
//  ├──────────────┼──────────────┼─────────────────┼───────────┤
//  │ EMPLOYEE     │ ✅           │ ✅              │ ❌        │
//  │ MANAGER      │ ✅           │ ✅              │ ✅        │
//  │ HR           │ ✅           │ ✅              │ ✅        │
//  │ CEO          │ ✅           │ ✅              │ ✅        │
//  └──────────────┴──────────────┴─────────────────┴───────────┘
//
function applyRolePermissions(user) {
  console.log("Logged in user:", user);
  const myRequestsLink    = document.getElementById("myRequestsLink");
  const reviewRequestsLink = document.getElementById("reviewRequestsLink");
  const dashboardLink     = document.getElementById("dashboardLink");

  // ✅ ALL roles: can see "My Requests"
  if (myRequestsLink) {
    myRequestsLink.classList.remove("hidden");
  }

  // ✅ CEO, HR, MANAGER only: can see "Review Requests"
  if (reviewRequestsLink) {
    if (canReviewRequests(user)) {
      reviewRequestsLink.classList.remove("hidden");
    } else {
      reviewRequestsLink.classList.add("hidden");
    }
  }

  // ✅ CEO, HR, MANAGER only: can see "Dashboard"
  // ❌ EMPLOYEE role: dashboard link is always hidden
  if (dashboardLink) {
    if (canReviewRequests(user)) {
      dashboardLink.classList.remove("hidden");
    } else {
      dashboardLink.classList.add("hidden");
    }
  }

  if (user.role === "CEO") {
    console.log("✅ CEO access granted - full control over all branches.");
  } else if (user.role === "HR") {
    console.log("✅ HR access granted - can approve/reject requests across all branches.");
  } else if (user.role === "MANAGER") {
    console.log("✅ Manager access granted for branch:", user.branch, "- can approve/reject requests from own branch only.");
  } else {
    console.log("✅ Employee access granted - Request Form and My Requests only. Dashboard is restricted.");
  }
}

function getCurrentUser() {
  const savedUser = localStorage.getItem("currentUser");
  if (!savedUser) return null;

  try {
    return JSON.parse(savedUser);
  } catch (err) {
    localStorage.removeItem("currentUser");
    return null;
  }
}

function autofillUserData(user) {
  if (!user) return;
  const nameInput = document.getElementById("employeeName");
  const idInput = document.getElementById("employeeId");
  const emailInput = document.getElementById("EmployeeEmail");

  if (nameInput) {
    nameInput.value = user.username || "";
    nameInput.readOnly = true;
    nameInput.style.backgroundColor = "rgba(0, 43, 33, 0.5)";
    nameInput.style.cursor = "not-allowed";
  }

  if (idInput) {
    idInput.value = user.id || "";
    idInput.readOnly = true;
    idInput.style.backgroundColor = "rgba(0, 43, 33, 0.5)";
    idInput.style.cursor = "not-allowed";
  }

  if (emailInput) {
    const userEmail = user.email || ((user.username || "user").toLowerCase() + "@zilk-atelier.com");
    emailInput.value = userEmail;
    emailInput.readOnly = true;
    emailInput.style.backgroundColor = "rgba(0, 43, 33, 0.5)";
    emailInput.style.cursor = "not-allowed";
  }
}

function canReviewRequests(user) {
  return Boolean(user && reviewRoles.includes(user.role));
}

// =============== LOAD REQUESTS FROM SERVER ===============
async function loadRequestData() {
  const tbody = document.getElementById("requestTableBody");
  if (!tbody) return;

  try {
    const res = await fetch("http://localhost:3000/api/requests");
    const requests = await res.json();

    // Store the fetched data into our global data structure
    requestDataStructure = requests;
    
    // Initial render of the full table
    renderTable(requestDataStructure);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6">Failed to load data.</td></tr>`;
  }
}

// =============== LOAD REVIEW REQUESTS FROM SERVER ===============
async function loadReviewRequests() {
  const reviewPage = document.getElementById("reviewPage");
  const accessMessage = document.getElementById("reviewAccessMessage");
  const tbody = document.getElementById("reviewTableBody");
  const currentUser = getCurrentUser();

  if (!tbody) return;

  if (!canReviewRequests(currentUser)) {
    if (reviewPage) reviewPage.classList.add("hidden");
    if (accessMessage) accessMessage.classList.remove("hidden");
    return;
  }

  try {
    const res = await fetch("http://localhost:3000/api/review-requests", {
      headers: {
        "X-User-Id": currentUser.id
      }
    });

    const result = await res.json();

    if (!result.success) {
      tbody.innerHTML = `<tr><td colspan="8">${escapeHtml(result.error || "Failed to load review data.")}</td></tr>`;
      return;
    }

    requestDataStructure = result.requests;
    renderReviewTable(requestDataStructure);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="8">Server unreachable. Is Node.js running?</td></tr>`;
  }
}

// =============== UI RENDERING FUNCTION ===============
// Separates the UI logic from the data and algorithm logic
function renderTable(dataArray) {
  const tbody = document.getElementById("requestTableBody");
  if (!tbody) return;

  tbody.innerHTML = "";
  if (dataArray.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6">No matching requests found.</td></tr>`;
    return;
  }

  dataArray.forEach(req => {
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
}

function renderReviewTable(dataArray) {
  const tbody = document.getElementById("reviewTableBody");
  if (!tbody) return;

  tbody.innerHTML = "";
  if (dataArray.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8">No matching requests found.</td></tr>`;
    return;
  }

  dataArray.forEach(req => {
    const status = req.Status || "Pending";
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${escapeHtml(req.Name)}</td>
      <td>${req.ID}</td>
      <td>${escapeHtml(req.Branch || "")}</td>
      <td>${req.Startdate}</td>
      <td>${req.Enddate}</td>
      <td>${status}</td>
      <td>${escapeHtml(req.Reason)}</td>
      <td>
        <select class="request-status-select" data-request-id="${req.RequestId}" aria-label="Decision for ${escapeHtml(req.Name)}">
          <option value="" ${status === "Pending" ? "selected" : ""} disabled>Choose</option>
          <option value="Approved" ${status === "Approved" ? "selected" : ""}>Approve</option>
          <option value="Rejected" ${status === "Rejected" ? "selected" : ""}>Reject</option>
        </select>
      </td>
    `;
    tbody.appendChild(row);
  });
}

async function updateRequestStatus(requestId, status) {
  const currentUser = getCurrentUser();

  if (!canReviewRequests(currentUser)) {
    alert("You do not have permission to review requests.");
    return;
  }

  try {
    const res = await fetch(`http://localhost:3000/api/review-requests/${requestId}/status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-Id": currentUser.id
      },
      body: JSON.stringify({ status })
    });

    const result = await res.json();

    if (!result.success) {
      alert(result.error || "Failed to update request status.");
      return;
    }

    await loadReviewRequests();
  } catch (err) {
    alert("Server unreachable. Is Node.js running?");
  }
}

// =============== SEARCH ALGORITHM ===============
/**
 * ALGORITHM: Linear Search
 * -------------------------
 * Data Structure Used: Array of Objects (where each object represents a database row).
 * Time Complexity: O(n) - We must check each record one by one in the worst case.
 * Space Complexity: O(k) - We create a new array to hold the 'k' matching results.
 * 
 * Why Linear Search? 
 * Because the user can search across multiple unsorted columns (Name, ID, Reason, etc.), 
 * Binary Search cannot be used here as it requires the data to be sorted by a single key.
 * 
 * @param {Array} dataArray - The array of objects to search through.
 * @param {String} query - The user's search input.
 * @returns {Array} A new array containing only the matching records.
 */
function linearSearch(dataArray, query, category = "all") {
  const results = [];
  const trimmedQuery = (query || "").trim();
  const lowerCaseQuery = trimmedQuery.toLowerCase();
  const normalizedCategory = (category || "all").toString().toLowerCase();

  for (let i = 0; i < dataArray.length; i++) {
    const record = dataArray[i];
    let isMatch = false;

    if (normalizedCategory === "name") {
      const nameValue = record.Name;
      const looksLikeText = /[A-Za-z]/.test(trimmedQuery);
      isMatch = Boolean(nameValue && looksLikeText && nameValue.toLowerCase().includes(lowerCaseQuery));
    } else if (normalizedCategory === "id") {
      const idValue = record.ID;
      const looksLikeNumber = /^\d+$/.test(trimmedQuery);
      isMatch = Boolean(idValue !== undefined && idValue !== null && looksLikeNumber && idValue.toString().includes(trimmedQuery));
    } else if (normalizedCategory === "status") {
      const statusValue = record.Status;
      isMatch = Boolean(statusValue && statusValue.toLowerCase().includes(lowerCaseQuery));
    } else {
      if (record.Name && record.Name.toLowerCase().includes(lowerCaseQuery)) isMatch = true;
      else if (record.ID && record.ID.toString().toLowerCase().includes(lowerCaseQuery)) isMatch = true;
      else if (record.Startdate && record.Startdate.toLowerCase().includes(lowerCaseQuery)) isMatch = true;
      else if (record.Enddate && record.Enddate.toLowerCase().includes(lowerCaseQuery)) isMatch = true;
      else if (record.Status && record.Status.toLowerCase().includes(lowerCaseQuery)) isMatch = true;
      else if (record.Branch && record.Branch.toLowerCase().includes(lowerCaseQuery)) isMatch = true;
      else if (record.Reason && record.Reason.toLowerCase().includes(lowerCaseQuery)) isMatch = true;
    }

    if (isMatch) {
      results.push(record);
    }
  }

  return results;
}

// Prevent XSS by escaping HTML
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}



// DASH BOARDDDDDD
    // ========================
    //  ACCESS GUARD
    //  Runs BEFORE anything else.
    //  Only CEO, HR, MANAGER may view this page.
    // ========================
    const ALLOWED_ROLES = ['CEO', 'HR', 'MANAGER'];

    function getDashboardUser() {
      try { return JSON.parse(localStorage.getItem('currentUser') || 'null'); }
      catch { return null; }
    }

    function showAccessDenied() {
      // Hide entire dashboard content immediately
      document.documentElement.style.overflow = 'hidden';

      const overlay = document.createElement('div');
      overlay.id = 'access-denied-overlay';
      overlay.innerHTML = `
        <style>
          #access-denied-overlay {
            position: fixed; inset: 0; z-index: 9999;
            background: #0b0f1a;
            display: flex; flex-direction: column;
            align-items: center; justify-content: center;
            gap: 20px; font-family: 'Inter', sans-serif;
          }
          .ad-icon { font-size: 64px; line-height: 1; }
          .ad-title {
            font-size: 28px; font-weight: 800;
            color: #f0f4ff; letter-spacing: -0.02em;
          }
          .ad-msg {
            font-size: 15px; color: #8b9cbf;
            max-width: 380px; text-align: center; line-height: 1.6;
          }
          .ad-role-badge {
            display: inline-block;
            padding: 4px 14px; border-radius: 20px;
            background: rgba(244,63,94,0.15);
            border: 1px solid rgba(244,63,94,0.35);
            color: #f43f5e; font-size: 13px; font-weight: 600;
            margin-top: 4px;
          }
          .ad-allowed {
            display: flex; gap: 8px; flex-wrap: wrap; justify-content: center;
          }
          .ad-allowed span {
            padding: 4px 14px; border-radius: 20px;
            background: rgba(79,142,247,0.12);
            border: 1px solid rgba(79,142,247,0.3);
            color: #4f8ef7; font-size: 12px; font-weight: 600;
          }
          .ad-countdown {
            font-size: 13px; color: #4a5870;
          }
          .ad-btn {
            padding: 10px 28px; border-radius: 10px;
            background: linear-gradient(135deg, #4f8ef7, #2dd4bf);
            border: none; color: #fff;
            font-family: 'Inter', sans-serif;
            font-size: 14px; font-weight: 600;
            cursor: pointer; transition: opacity 0.2s;
          }
          .ad-btn:hover { opacity: 0.85; }
          .ad-divider { width: 40px; height: 2px; background: rgba(255,255,255,0.08); border-radius: 2px; }
        </style>
        <div class="ad-icon">🔒</div>
        <div class="ad-title">Access Restricted</div>
        <div class="ad-divider"></div>
        <div class="ad-msg">
          The <strong>HR Dashboard</strong> is only available to privileged roles.
          Your current role does not have permission to view this page.
        </div>
        <div class="ad-allowed">
          <span>HR</span><span>MANAGER</span><span>CEO</span>
        </div>
        <div class="ad-countdown" id="adCountdown">Redirecting in 5 seconds…</div>
        <button class="ad-btn" onclick="window.location.href='index.html'">← Back to Request Form</button>
      `;
      document.body.appendChild(overlay);

      // Countdown then redirect
      let secs = 5;
      const countEl = document.getElementById('adCountdown');
      const timer = setInterval(() => {
        secs--;
        if (countEl) countEl.textContent = `Redirecting in ${secs} second${secs !== 1 ? 's' : ''}…`;
        if (secs <= 0) { clearInterval(timer); window.location.href = 'index.html'; }
      }, 1000);
    }

    // Run guard immediately (before DOM loads)
    (function runGuard() {
      if (!window.location.pathname.includes("dashboard.html")) {
        return;
      }
      const user = getDashboardUser();
      if (!user || !ALLOWED_ROLES.includes(user.role)) {
        // Prevent DOMContentLoaded from kicking off data fetch
        window._dashboardAccessDenied = true;
        document.addEventListener('DOMContentLoaded', showAccessDenied);
      }
    })();

    // ========================
    //  CONFIG
    // ========================
    const API_BASE = 'http://localhost:3000';
    const ROWS_PER_PAGE = 10;

    // ========================
    //  STATE
    // ========================
    let allData = [];
    let filteredData = [];
    let currentPage = 1;
    let sortCol = 'Startdate';
    let sortDir = 'desc';
    let statusFilter = 'all';
    let searchQuery = '';

    // Chart instances
    let donutChart, typeChart, monthChart, branchChart;

    // ========================
    //  INIT
    // ========================
    document.addEventListener('DOMContentLoaded', () => {
      // Abort if access guard blocked entry
      if (window._dashboardAccessDenied) return;

      fetchData();
      initEventListeners();
    });

    function initEventListeners() {
      document.getElementById('refreshBtn').addEventListener('click', () => {
        const btn = document.getElementById('refreshBtn');
        btn.classList.add('spinning');
        fetchData().finally(() => {
          setTimeout(() => btn.classList.remove('spinning'), 600);
        });
      });

      document.getElementById('tableSearch').addEventListener('input', (e) => {
        searchQuery = e.target.value.trim().toLowerCase();
        currentPage = 1;
        applyFiltersAndRender();
      });

      document.getElementById('statusChips').addEventListener('click', (e) => {
        const chip = e.target.closest('[data-status]');
        if (!chip) return;
        statusFilter = chip.dataset.status;
        document.querySelectorAll('#statusChips .chip').forEach(c => {
          c.classList.remove('active');
          if (c.dataset.status === statusFilter) c.classList.add('active');
        });
        currentPage = 1;
        applyFiltersAndRender();
      });

      document.getElementById('exportCsvBtn').addEventListener('click', exportCSV);

      document.querySelectorAll('#mainTable th[data-col]').forEach(th => {
        th.addEventListener('click', () => {
          const col = th.dataset.col;
          if (sortCol === col) {
            sortDir = sortDir === 'asc' ? 'desc' : 'asc';
          } else {
            sortCol = col;
            sortDir = 'asc';
          }
          updateSortHeaders();
          applyFiltersAndRender();
        });
      });
    }

    // ========================
    //  FETCH DATA
    // ========================
    async function fetchData() {
      try {
        // Try authenticated review endpoint first (CEO/HR/MANAGER)
        // Fall back to regular requests endpoint
        let requests = [];

        try {
          const res = await fetch(`${API_BASE}/api/review-requests`, {
            headers: { 'X-User-Id': getCurrentUserId() }
          });
          const result = await res.json();
          if (result.success && Array.isArray(result.requests)) {
            requests = result.requests;
          } else {
            throw new Error('not review');
          }
        } catch {
          const res2 = await fetch(`${API_BASE}/api/requests`);
          requests = await res2.json();
        }

        allData = enrichData(requests);
        applyFiltersAndRender();
        updateKPIs();
        updateCharts();
        updateTopEmployees();

        const now = new Date();
        document.getElementById('lastUpdatedLabel').textContent =
          `Last updated: ${now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;

        showToast('Dashboard data refreshed ✓');
      } catch (err) {
        console.error('Fetch error:', err);
        showEmptyState('Could not connect to server. Is Node.js running?');
      }
    }

    function getCurrentUserId() {
      try {
        const u = JSON.parse(localStorage.getItem('currentUser') || '{}');
        return u.id || '';
      } catch { return ''; }
    }

    // Enrich raw data with computed fields
    function enrichData(raw) {
      return raw.map(r => {
        const start = new Date(r.Startdate || r.startDate);
        const end = new Date(r.Enddate || r.endDate);
        const duration = isNaN(start) || isNaN(end) ? 0
          : Math.max(0, Math.round((end - start) / 86400000) + 1);

        return {
          Name: r.Name || r.employeeName || '—',
          ID: r.ID || r.employeeId || '—',
          Branch: r.Branch || r.branch || 'N/A',
          absenceType: r.absenceType || r.AbsenceType || 'Other',
          Startdate: r.Startdate || r.startDate || '',
          Enddate: r.Enddate || r.endDate || '',
          Status: r.Status || r.status || 'Pending',
          Reason: r.Reason || r.reason || '',
          RequestId: r.RequestId || r.id || '',
          duration,
        };
      });
    }

    // ========================
    //  KPI CARDS
    // ========================
    function updateKPIs() {
      const total = allData.length;
      const approved = allData.filter(r => r.Status === 'Approved').length;
      const pending = allData.filter(r => r.Status === 'Pending').length;
      const rejected = allData.filter(r => r.Status === 'Rejected').length;
      const avgDays = total
        ? (allData.reduce((s, r) => s + r.duration, 0) / total).toFixed(1)
        : '0';

      animateCount('kpiTotal', total);
      animateCount('kpiApproved', approved);
      animateCount('kpiPending', pending);
      animateCount('kpiRejected', rejected);
      document.getElementById('kpiAvgDays').textContent = avgDays;

      document.getElementById('kpiApprovedPct').textContent =
        total ? `${Math.round(approved / total * 100)}% of total` : '0% of total';
      document.getElementById('kpiPendingPct').textContent =
        total ? `${Math.round(pending / total * 100)}% awaiting` : '0% awaiting';
      document.getElementById('kpiRejectedPct').textContent =
        total ? `${Math.round(rejected / total * 100)}% of total` : '0% of total';
    }

    function animateCount(id, target) {
      const el = document.getElementById(id);
      if (!el) return;
      const start = parseInt(el.textContent) || 0;
      const duration = 600;
      const startTime = performance.now();
      function update(now) {
        const t = Math.min((now - startTime) / duration, 1);
        el.textContent = Math.round(start + (target - start) * easeOut(t));
        if (t < 1) requestAnimationFrame(update);
      }
      requestAnimationFrame(update);
    }

    function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

    // ========================
    //  CHARTS
    // ========================
    const CHART_DEFAULTS = {
      font: { family: 'Inter, sans-serif' },
      color: '#8b9cbf',
    };

    Chart.defaults.font.family = CHART_DEFAULTS.font.family;
    Chart.defaults.color = CHART_DEFAULTS.color;

    function updateCharts() {
      buildDonutChart();
      buildTypeChart();
      buildMonthChart();
      buildBranchChart();
    }

    function buildDonutChart() {
      const approved = allData.filter(r => r.Status === 'Approved').length;
      const pending = allData.filter(r => r.Status === 'Pending').length;
      const rejected = allData.filter(r => r.Status === 'Rejected').length;
      const total = allData.length;

      document.getElementById('donutTotal').textContent = total;

      const data = {
        labels: ['Approved', 'Pending', 'Rejected'],
        datasets: [{
          data: [approved, pending, rejected],
          backgroundColor: ['#10b981', '#f59e0b', '#f43f5e'],
          borderColor: '#121828',
          borderWidth: 3,
          hoverOffset: 8,
        }]
      };

      if (donutChart) donutChart.destroy();
      const ctx = document.getElementById('donutChart').getContext('2d');
      donutChart = new Chart(ctx, {
        type: 'doughnut',
        data,
        options: {
          cutout: '70%',
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => ` ${ctx.label}: ${ctx.raw} (${total ? Math.round(ctx.raw / total * 100) : 0}%)`
              }
            }
          },
          animation: { animateRotate: true, duration: 800 }
        }
      });

      // Build custom legend
      const legend = document.getElementById('donutLegend');
      const items = [
        { label: 'Approved', count: approved, color: '#10b981' },
        { label: 'Pending', count: pending, color: '#f59e0b' },
        { label: 'Rejected', count: rejected, color: '#f43f5e' },
      ];
      legend.innerHTML = items.map(i => `
        <div class="legend-item">
          <span class="legend-dot" style="background:${i.color}"></span>
          <span class="legend-name">${i.label}</span>
          <span class="legend-count">${i.count}</span>
          <span class="legend-pct">${total ? Math.round(i.count / total * 100) : 0}%</span>
        </div>
      `).join('');
    }

    function buildTypeChart() {
      const typeCounts = {};
      allData.forEach(r => {
        const t = formatAbsenceType(r.absenceType);
        typeCounts[t] = (typeCounts[t] || 0) + 1;
      });

      const labels = Object.keys(typeCounts);
      const values = Object.values(typeCounts);
      const colors = ['#4f8ef7', '#2dd4bf', '#f59e0b', '#a78bfa', '#f43f5e'];

      if (typeChart) typeChart.destroy();
      const ctx = document.getElementById('typeChart').getContext('2d');
      typeChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Requests',
            data: values,
            backgroundColor: labels.map((_, i) => colors[i % colors.length] + '99'),
            borderColor: labels.map((_, i) => colors[i % colors.length]),
            borderWidth: 2,
            borderRadius: 6,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { font: { size: 11 } } },
            y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { stepSize: 1, font: { size: 11 } }, beginAtZero: true }
          }
        }
      });
    }

    function buildMonthChart() {
      // Group by month from Startdate
      const monthCounts = {};
      allData.forEach(r => {
        if (!r.Startdate) return;
        const d = new Date(r.Startdate);
        if (isNaN(d)) return;
        const key = d.toLocaleString('en-US', { month: 'short', year: '2-digit' });
        monthCounts[key] = (monthCounts[key] || 0) + 1;
      });

      // Sort chronologically
      const entries = Object.entries(monthCounts)
        .map(([k, v]) => ({ key: k, val: v }))
        .sort((a, b) => new Date('01 ' + a.key) - new Date('01 ' + b.key));

      const labels = entries.map(e => e.key);
      const values = entries.map(e => e.val);

      // If no real data, show placeholder months
      const finalLabels = labels.length ? labels :
        ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
      const finalValues = values.length ? values :
        [0, 0, 0, 0, 0, 0, 0];

      if (monthChart) monthChart.destroy();
      const ctx = document.getElementById('monthChart').getContext('2d');

      const gradient = ctx.createLinearGradient(0, 0, 0, 220);
      gradient.addColorStop(0, 'rgba(79,142,247,0.35)');
      gradient.addColorStop(1, 'rgba(79,142,247,0.02)');

      monthChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: finalLabels,
          datasets: [{
            label: 'Requests',
            data: finalValues,
            fill: true,
            backgroundColor: gradient,
            borderColor: '#4f8ef7',
            borderWidth: 2.5,
            pointBackgroundColor: '#4f8ef7',
            pointBorderColor: '#121828',
            pointBorderWidth: 2,
            pointRadius: 5,
            tension: 0.4,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { font: { size: 11 } } },
            y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { stepSize: 1, font: { size: 11 } }, beginAtZero: true }
          }
        }
      });
    }

    function buildBranchChart() {
      const branchCounts = {};
      allData.forEach(r => {
        const b = r.Branch || 'N/A';
        branchCounts[b] = (branchCounts[b] || 0) + 1;
      });

      const entries = Object.entries(branchCounts).sort((a, b) => b[1] - a[1]);
      const labels = entries.map(e => e[0]);
      const values = entries.map(e => e[1]);

      if (branchChart) branchChart.destroy();
      const ctx = document.getElementById('branchChart').getContext('2d');
      branchChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels,
          datasets: [{
            label: 'Requests',
            data: values,
            backgroundColor: 'rgba(167,139,250,0.25)',
            borderColor: '#a78bfa',
            borderWidth: 2,
            borderRadius: 6,
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { stepSize: 1, font: { size: 11 } }, beginAtZero: true },
            y: { grid: { display: false }, ticks: { font: { size: 11 } } }
          }
        }
      });
    }

    // ========================
    //  TOP EMPLOYEES TABLE
    // ========================
    function updateTopEmployees() {
      const empCounts = {};
      allData.forEach(r => {
        const key = r.Name;
        empCounts[key] = (empCounts[key] || 0) + 1;
      });

      const sorted = Object.entries(empCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);

      const max = sorted.length ? sorted[0][1] : 1;
      const tbody = document.getElementById('topEmployeesBody');

      if (!sorted.length) {
        tbody.innerHTML = `<tr><td colspan="4"><div class="empty-state"><div class="icon">📭</div><p>No data yet</p></div></td></tr>`;
        return;
      }

      tbody.innerHTML = sorted.map(([name, count], i) => {
        const rankClass = i === 0 ? 'r1' : i === 1 ? 'r2' : i === 2 ? 'r3' : 'rn';
        const pct = Math.round(count / max * 100);
        return `
          <tr>
            <td><span class="rank ${rankClass}">${i + 1}</span></td>
            <td style="color:var(--text-primary);font-weight:500;">${escapeHtml(name)}</td>
            <td style="color:var(--accent-blue);font-weight:600;">${count}</td>
            <td>
              <div class="bar-bg">
                <div class="bar-fill" style="width:${pct}%"></div>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    }

    // ========================
    //  TABLE: FILTER + SORT + PAGINATE
    // ========================
    function applyFiltersAndRender() {
      let data = [...allData];

      // Status filter
      if (statusFilter !== 'all') {
        data = data.filter(r => r.Status === statusFilter);
      }

      // Search filter
      if (searchQuery) {
        data = data.filter(r =>
          (r.Name || '').toLowerCase().includes(searchQuery) ||
          (r.ID || '').toString().includes(searchQuery) ||
          (r.Branch || '').toLowerCase().includes(searchQuery) ||
          (r.Reason || '').toLowerCase().includes(searchQuery) ||
          (r.Status || '').toLowerCase().includes(searchQuery)
        );
      }

      // Sort
      data.sort((a, b) => {
        let va = a[sortCol] ?? '';
        let vb = b[sortCol] ?? '';
        if (sortCol === 'duration' || sortCol === 'ID') {
          va = Number(va); vb = Number(vb);
          return sortDir === 'asc' ? va - vb : vb - va;
        }
        va = va.toString().toLowerCase();
        vb = vb.toString().toLowerCase();
        return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
      });

      filteredData = data;

      const total = filteredData.length;
      const pages = Math.max(1, Math.ceil(total / ROWS_PER_PAGE));
      if (currentPage > pages) currentPage = pages;

      renderTablePage();
      renderPagination(total, pages);
      document.getElementById('tableCount').textContent =
        `Showing ${total} record${total !== 1 ? 's' : ''}`;
    }

    function renderTablePage() {
      const tbody = document.getElementById('mainTableBody');
      const start = (currentPage - 1) * ROWS_PER_PAGE;
      const page = filteredData.slice(start, start + ROWS_PER_PAGE);

      if (!page.length) {
        tbody.innerHTML = `
          <tr>
            <td colspan="8">
              <div class="empty-state">
                <div class="icon">🔍</div>
                <h4>No results found</h4>
                <p>Try adjusting your filters or search term.</p>
              </div>
            </td>
          </tr>`;
        return;
      }

      tbody.innerHTML = page.map(r => `
        <tr>
          <td class="td-name">${escapeHtml(r.Name)}</td>
          <td class="td-id">#${escapeHtml(String(r.ID))}</td>
          <td>${escapeHtml(r.Branch)}</td>
          <td><span class="absence-tag">${escapeHtml(formatAbsenceType(r.absenceType))}</span></td>
          <td>${formatDate(r.Startdate)}</td>
          <td>${formatDate(r.Enddate)}</td>
          <td><span class="duration-pill">${r.duration}d</span></td>
          <td><span class="badge ${(r.Status || 'pending').toLowerCase()}">${escapeHtml(r.Status || 'Pending')}</span></td>
        </tr>
      `).join('');
    }

    function renderPagination(total, pages) {
      const info = document.getElementById('paginationInfo');
      const controls = document.getElementById('paginationControls');
      const start = (currentPage - 1) * ROWS_PER_PAGE + 1;
      const end = Math.min(currentPage * ROWS_PER_PAGE, total);
      info.textContent = total ? `${start}–${end} of ${total} records` : '0 records';

      let html = `
        <button class="page-btn" id="prevPage" aria-label="Previous page" ${currentPage <= 1 ? 'disabled' : ''}>‹</button>
      `;
      for (let p = 1; p <= pages; p++) {
        if (pages > 7 && p !== 1 && p !== pages && Math.abs(p - currentPage) > 2) {
          if (p === 2 || p === pages - 1) html += `<span class="page-btn" style="cursor:default">…</span>`;
          continue;
        }
        html += `<button class="page-btn ${p === currentPage ? 'active' : ''}" data-page="${p}">${p}</button>`;
      }
      html += `<button class="page-btn" id="nextPage" aria-label="Next page" ${currentPage >= pages ? 'disabled' : ''}>›</button>`;
      controls.innerHTML = html;

      controls.querySelectorAll('[data-page]').forEach(btn => {
        btn.addEventListener('click', () => {
          currentPage = parseInt(btn.dataset.page);
          applyFiltersAndRender();
        });
      });
      const prev = document.getElementById('prevPage');
      const next = document.getElementById('nextPage');
      if (prev) prev.addEventListener('click', () => { currentPage--; applyFiltersAndRender(); });
      if (next) next.addEventListener('click', () => { currentPage++; applyFiltersAndRender(); });
    }

    function updateSortHeaders() {
      document.querySelectorAll('#mainTable th[data-col]').forEach(th => {
        th.classList.remove('sort-asc', 'sort-desc');
        if (th.dataset.col === sortCol) {
          th.classList.add(sortDir === 'asc' ? 'sort-asc' : 'sort-desc');
        }
      });
    }

    // ========================
    //  EXPORT CSV
    // ========================
    function exportCSV() {
      const headers = ['Name', 'ID', 'Branch', 'Type', 'Start Date', 'End Date', 'Duration (Days)', 'Status', 'Reason'];
      const rows = filteredData.map(r => [
        r.Name, r.ID, r.Branch,
        formatAbsenceType(r.absenceType),
        r.Startdate, r.Enddate, r.duration,
        r.Status, r.Reason
      ]);
      const csv = [headers, ...rows]
        .map(row => row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(','))
        .join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `absence_requests_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('CSV exported successfully ✓');
    }

    // ========================
    //  EMPTY STATE
    // ========================
    function showEmptyState(msg) {
      document.getElementById('mainTableBody').innerHTML = `
        <tr><td colspan="8">
          <div class="empty-state">
            <div class="icon">⚠️</div>
            <h4>Unable to load data</h4>
            <p>${escapeHtml(msg)}</p>
          </div>
        </td></tr>`;
      document.getElementById('tableCount').textContent = 'Server unreachable';
    }

    // ========================
    //  TOAST
    // ========================
    let toastTimeout;
    function showToast(msg) {
      const toast = document.getElementById('toast');
      document.getElementById('toastMsg').textContent = msg;
      toast.classList.add('show');
      clearTimeout(toastTimeout);
      toastTimeout = setTimeout(() => toast.classList.remove('show'), 3000);
    }

    // ========================
    //  HELPERS
    // ========================
    function escapeHtml(text) {
      const d = document.createElement('div');
      d.textContent = text;
      return d.innerHTML;
    }

    function formatDate(str) {
      if (!str) return '—';
      const d = new Date(str);
      if (isNaN(d)) return str;
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
    }

    function formatAbsenceType(t) {
      if (!t) return 'Other';
      const map = {
        sickLeave: 'Sick Leave',
        vacation: 'Vacation',
        personalLeave: 'Personal Leave',
        other: 'Other',
      };
      return map[t] || t.replace(/([A-Z])/g, ' $1').trim();
    }