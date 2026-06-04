// Wait for the HTML elements to fully load into the browser before running code
window.addEventListener("DOMContentLoaded", () => {
    
    // 1. Select the login button using its class '.signin'
    const loginButton = document.querySelector(".signin");

    // Check if the button actually exists to prevent errors
    if (loginButton) {
        loginButton.addEventListener("click", function(event) {
            // CRITICAL: Stops the page from refreshing/submitting!
            event.preventDefault(); 

            // 2. Grab the values from the input fields
            // Note: If you typed 'Username' with a capital U in your HTML id, match it here
            const usernameInput = document.getElementById("username").value;
            const passwordInput = document.getElementById("password").value;

            // 3. Simple credentials test (Change these to whatever you want)
            if (usernameInput === "admin" && passwordInput === "123") {
    alert("Login successful!");
    
    // Add the hidden class to the login form to hide it
    document.getElementById("LoginForm").classList.add("hidden");
    
    // Remove the hidden class from container1 to show it
    document.getElementById("container1").classList.remove("hidden");

            } else {
                alert("Invalid username or password.");
            }
        });
    } else {
        console.error("Could not find the button with class '.signin'!");
    }

});


