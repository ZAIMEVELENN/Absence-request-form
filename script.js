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

if (window.location.pathname.includes("reqboard.html")) {
    loadRequestData();
}

document.addEventListener("DOMContentLoaded", () => {
  // =============== LOGIN HANDLER ===============
  const loginBtn = document.querySelector(".signin");
  const loginFormDiv = document.getElementById("LoginForm"); // FIX: Added missing variable
  const signupFormDiv = document.getElementById("SignupBTN"); // FIX: Changed ID to match HTML
  const signupBtn = document.querySelector(".signup"); // FIX: Added missing variable

  if (loginBtn) {
    loginBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const user = document.getElementById("username").value;
      const pass = document.getElementById("password").value;

      if (user === "admin" && pass === "123") {
        if(loginFormDiv) loginFormDiv.classList.add("hidden");
        const container1 = document.getElementById("container1");
        if(container1) container1.classList.remove("hidden");
        const reqReview = document.getElementById("ReqFormReview");
        if(reqReview) reqReview.classList.remove("hidden"); 
      } else {
        alert("Invalid credentials.");
      }
    });
  }

  // FIX: Added proper checks so the page doesn't crash if elements are missing
  if (signupBtn && loginFormDiv && signupFormDiv) {
    signupBtn.addEventListener("click", (e) => {
      e.preventDefault();
      loginFormDiv.classList.add("hidden");
      signupFormDiv.classList.remove("hidden");
    });
  }

  // =============== SEARCH FUNCTIONALITY ===============
  const searchInput = document.getElementById("search");
  const searchCategory = document.getElementById("searchCategory");

  // Centralized function to handle search logic
  function performSearch() {
    const query = searchInput ? searchInput.value.trim() : "";
    const category = searchCategory ? searchCategory.value : 'all';
    
    if (query === "") {
      renderTable(requestDataStructure);
    } else {
      // Pass the selected category into our algorithm
      const filteredData = linearSearch(requestDataStructure, query, category);
      renderTable(filteredData);
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

    // Store the fetched data into our global data structure
    requestDataStructure = requests;
    
    // Initial render of the full table
    renderTable(requestDataStructure);
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6">Failed to load data.</td></tr>`;
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

