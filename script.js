// Toggle this to true to test the frontend and form submit success handling without running the backend node server
const MOCK_MODE = true

if (typeof window !== "undefined" && MOCK_MODE) {
  const originalFetch = window.fetch;
  window.fetch = async function (url, options) {
    if (url.includes("/api/submit-absence")) {
      console.log("Mock API Submit triggered with data:", options.body);
      // Simulate network delay for realistic experience
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        json: async () => ({ success: true })
      };
    }
    return originalFetch.apply(this, arguments);
  };
}

// Wait for all HTML structural assets to load before running scripts
window.addEventListener("DOMContentLoaded", () => {
  
  // ==========================================
  // 1. LOGIN INTERFACES MANAGEMENT
  // ==========================================
  const loginButton = document.querySelector(".signin");

  if (loginButton) {
    loginButton.addEventListener("click", function (event) {
      event.preventDefault(); // Stop page from blanking/refreshing

      // Grab elements dynamically
      const usernameInput = document.getElementById("username").value;
      const passwordInput = document.getElementById("password").value;

      // Verify explicit administrative authorization credentials
      if (usernameInput === "admin" && passwordInput === "123") {
        alert("Login successful!");

        // Add the hidden class to clear away the Login Box
        document.getElementById("LoginForm").classList.add("hidden");

        // Reveal the main Absence Form interface block cleanly
        document.getElementById("container1").classList.remove("hidden");
      } else {
        alert("Invalid username or password.");
      }
    });
  }

  // ==========================================
  // 2. SUBMIT ABSENCE FORM PROCESS
  // ==========================================
  const absenceForm = document.getElementById("absenceRequestForm");

  if (absenceForm) {
    absenceForm.addEventListener("submit", async function (event) {
      event.preventDefault(); // Stop default browser pipeline handling

      // Collect field configurations matching your exact HTML layout casings
      const formData = {
        employeeName: document.getElementById("employeeName").value,
        employeeId: document.getElementById("employeeId").value, // Matches id="employeeId"
        employeeEmail: document.getElementById("EmployeeEmail").value, // Matches id="EmployeeEmail"
        startDate: document.getElementById("startDate").value,
        endDate: document.getElementById("endDate").value,
        absenceType: document.getElementById("absenceType").value,
        reason: document.getElementById("reason").value
      };

      try {
        // Dispatch data straight to your Node endpoint
        const response = await fetch("http://localhost:3000/api/submit-absence", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (result.success) {
          alert("THANKS FOR SUBMITING PLEASE AWAIT FOR EMAIL WITHIN 48HOURS IF THERE IS NO REPLY YOU CAN CONTACT TO +855 8965 4048");
          absenceForm.reset(); // Safely flushes fields clean
        } else {
          alert("❌ Submission failed: " + result.error);
        }
      } catch (error) {
        console.error("Network interface pipeline error:", error);
        alert("❌ Could not reach the server. Make sure your node application is active.");
      }
    });
  }
});