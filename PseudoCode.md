# ZILK ATELIER — Absence Request Form: Unified Pseudocode & Technical Report

This document combines the plain-language walkthrough of the project files with the formal technical specifications for the **Data Structures** and **Algorithms** used in the application.

---
# PART 0: LINEAR Algorithm that is used in this project in pseudoCode
```
FUNCTION Find_Matches(record_list, search_word, category = "all")
    
    // Step 1: Clean up the search word so it's easy to match
    clean_word = remove extra spaces from search_word
    clean_word = make clean_word completely lowercase
    
    // Step 2: Create an empty folder to hold the results
    matches = empty list
    
    // Step 3: Look at every single record, one by one
    FOR EACH record IN record_list:
        
        is_a_match = FALSE
        
        // Step 4: Check for a match based on the chosen category
        IF category is "name":
            IF clean_word contains actual letters AND record.Name contains clean_word:
                is_a_match = TRUE
                
        ELSE IF category is "id":
            IF clean_word is made of ONLY numbers AND record.ID contains clean_word:
                is_a_match = TRUE
                
        ELSE IF category is "status":
            IF record.Status contains clean_word:
                is_a_match = TRUE
                
        ELSE (meaning category is "all"):
            IF clean_word is found in record.Name OR
               clean_word is found in record.ID OR
               clean_word is found in record.StartDate OR
               clean_word is found in record.EndDate OR
               clean_word is found in record.Status OR
               clean_word is found in record.Branch OR
               clean_word is found in record.Reason:
                is_a_match = TRUE
        
        // Step 5: If it's a match, save it to our results folder
        IF is_a_match is TRUE:
            add record to matches list
            
    // Step 6: Hand back the final list of matching records
    RETURN matches
```
# PART 1: Technical Data Structures & Algorithms

This section outlines the data schemas and logical algorithms used within the Absence Request Form, pointing out where structures are accessed and where logical rules are enforced.

## 1. Data Structures
A **Data Structure** is a structured format for organizing, processing, retrieving, and storing data.

### A. User Authentication Schema (`User`)
* **Classification**: Object / Record Structure
* **Purpose**: Represents a user account credential record in memory or a database row.

| Field Name | Data Type | Description | Constraints / Validation |
| :--- | :--- | :--- | :--- |
| `username` | String | Unique username for logging in | Required, case-insensitive, minimum 4 characters |
| `password` | String | User's security credentials | Required |

### B. Absence Request Schema (`AbsenceRequest`)
* **Classification**: Object / Record Structure
* **Purpose**: Holds all details associated with a single absence submission. It maps directly to a table row in the relational database (`REQUESTINFO`).

| Field Name | Data Type | Description | Constraints / Validation |
| :--- | :--- | :--- | :--- |
| `employeeName` | String | Full name of the employee | Required |
| `employeeId` | String | Unique identifier for the employee | Required |
| `employeeEmail` | String | Work email address | Required, must match valid email format |
| `startDate` | Date | First day of the requested absence | Required, must be in the future |
| `endDate` | Date | Last day of the requested absence | Required, must be equal to or after `startDate` |
| `absenceType` | Enum | Classification of the leave | Must be one of: `sickLeave`, `vacation`, `personalLeave`, `other` |
| `reason` | String | Description or justification for absence | Required |
| `supportingDocument`| File (Optional) | Uploaded attachment (image/PDF) | Optional |
| `status` | String | State of the request | Auto-generated: defaults to `pending` |
| `submissionDate` | Date | Timestamp of form submission | Auto-generated: current date/time |

---

## 2. Pseudocode Logic (Algorithms & Structural Interactions)
An **Algorithm** is a step-by-step set of instructions or rules designed to solve a specific problem or perform a task.

### A. Login Authentication Logic
* **Algorithm**: Credentials Verification & Flow Control Algorithm.
* **Data Structure Involved**: Reads runtime inputs and compares them against target record attributes.

```text
PROCEDURE AuthenticateUser(username, password)
    // [ALGORITHM: Input Validation Step]
    // Checks if the string inputs are empty or null
    IF username is empty OR password is empty THEN
        DISPLAY "Please enter both username and password."
        RETURN FALSE
    END IF

    // [ALGORITHM: Lookup/Comparison Step]
    // Compares runtime string inputs to the predefined User Data Structure fields
    IF username EQUALS "admin" AND password EQUALS "123" THEN
        DISPLAY "Login successful!"
        // [ALGORITHM: UI State Transition]
        HIDE section "LoginForm"
        SHOW section "container1"
        RETURN TRUE
    ELSE
        DISPLAY "Invalid username or password."
        RETURN FALSE
    END IF
END PROCEDURE
```

### B. Absence Form Validation and Submission Logic
* **Algorithm**: Constraint Check & Validation Algorithm.
* **Data Structure Involved**: Reads properties from the incoming `AbsenceRequest` object (`requestData`) and saves it to the database table.

```text
PROCEDURE SubmitAbsenceRequest(requestData)
    // [DATA STRUCTURE ACCESS]: Reading properties of requestData (an AbsenceRequest object)

    // [ALGORITHM: Range Check Constraint]
    // Verifies chronological sequence of dates
    IF requestData.startDate > requestData.endDate THEN
        DISPLAY "Error: End Date cannot be before Start Date."
        RETURN FALSE
    END IF

    // [ALGORITHM: Date Difference Arithmetic]
    // Computes target date boundaries to enforce the "2 weeks in advance" rule
    currentDate = GET_CURRENT_DATE()
    twoWeeksFromNow = currentDate + 14 days

    IF requestData.startDate < twoWeeksFromNow THEN
        DISPLAY "Error: Requests must be submitted at least 2 weeks in advance."
        RETURN FALSE
    END IF

    // [ALGORITHM: Pattern Matching Delegation]
    // Invokes email format validation algorithm
    IF NOT IsValidEmail(requestData.employeeEmail) THEN
        DISPLAY "Error: Invalid email format."
        RETURN FALSE
    END IF

    // [ALGORITHM: Database Write Operation]
    // Inserts the AbsenceRequest data structure record into the persistent database collection
    TRY
        SEND requestData TO Database
        DISPLAY "Success: Your request has been submitted for approval."
        RESET absenceRequestForm
        RETURN TRUE
    CATCH DatabaseError
        DISPLAY "Error: Failed to submit request due to a network or database error."
        RETURN FALSE
    END TRY
END PROCEDURE
```

### C. Helper: Email Validation Utility
* **Algorithm**: Regular Expression Pattern Matching Algorithm.
* **Data Structure Involved**: Operates on a `String` data structure.

```text
FUNCTION IsValidEmail(email)
    // [ALGORITHM: Regular Expression Matching]
    // Parses string to check compliance with typical email formatting constraints
    IF email matches pattern "^[^@]+@[^@]+\.[^@]+$" THEN
        RETURN TRUE
    ELSE
        RETURN FALSE
    END IF
END FUNCTION
```

---

# PART 2: Plain-Language Walkthrough of System Files

> This section explains how each file contributes to the overall website architecture.

## PROJECT OVERVIEW
This project is a website that allows employees of ZILK ATELIER to log in, fill out an absence form, and submit it to be saved in a background database.

| File | Role |
| :--- | :--- |
| `index.html` | The **structure** — what you actually see on screen (pages, buttons, fields) |
| `style.css` | The **appearance** — colors, fonts, sizes, spacing, hover effects |
| `script.js` | The **behavior** — what happens when you click buttons or submit forms |
| `server.js` | The **brain in the background** — receives the form data and saves it to the database |

---

## FILE 1: index.html — "What the User Sees"
```
BEFORE the page is shown to the user:
  - Set the page title to "Absence Request Form"
  - Tell the browser this page is in English
  - Make the page look good on mobile phones too
  - Load the visual styling file: style.css
  - Set the browser tab icon to the company logo (ZILK_LOGO.png)
```

### SECTION 1: Login Form (`id="LoginForm"`)
```
DISPLAY a login screen that contains:
  TOP AREA — Brand Header:
    - Show the company logo image (ZILK_LOGO.png)
    - Show the company name: "ZILK ATELIER" (big heading)
    - Show the sub-title: "Absence Request Form" (smaller heading)
  GREETING TEXT:
    - Show the message: "Welcome, please input your credential"
  LOGIN BOX (the dark green card):
    - Show a "Login" heading in gold color
    - Show a label: "Username :"
    - Show a text input box where the user types their username
    - Show a label: "Password :"
    - Show a password input box (text is hidden as dots)
    - Show 3 buttons side by side:
        1. "Log in"         → triggers the login check
        2. "Sign up"        → future feature
        3. "Forget Password" → future feature
```

### SECTION 2: Absence Request Form (`id="container1"`)
```
DISPLAY the main form area (only shown after login):
  TOP HEADER BAR:
    - Show company logo and name again
    - Show a navigation bar (currently hidden links)
  WARNING NOTE (in red text):
    - "Please submit this form at least 2 weeks before the request date, any less will be denied."
  --- EMPLOYEE INFORMATION SECTION ---
    - Label + Input: "Employee Name" (REQUIRED)
    - Label + Input: "Employee ID" (REQUIRED)
    - Label + Input: "Employee Email" (REQUIRED, name@company.com format)
  --- ABSENCE INFORMATION SECTION ---
    DATE SUBSECTION:
      - Label + Date Picker: "Start Date" (REQUIRED)
      - Label + Date Picker: "End Date" (REQUIRED)
      - Label + Dropdown Menu: "Type of Absence" (REQUIRED)
    REASON & DOCUMENT SUBSECTION:
      - Label + Large Text Box: "Reason for Absence" (REQUIRED)
      - Label + File Upload Area: "Supporting Document (optional)"
      - Button: "Submit Request"
```

### SECTION 3: Request Preview Table (`id="ReqFormReview"`)
```
DISPLAY a preview table (hidden for now, planned for future):
  Title: "Request Preview"
  TABLE with these column headers: Name, ID, Start Date, End Date, Status, Reason
  TABLE BODY: empty (waiting for backend data feature)
```

---

## FILE 2: style.css — "How Everything Looks"
```
DEFINE a set of shared colors and fonts for the whole site:
  Primary Color    = Deep Emerald Green  (#00674F)
  Secondary Color  = Soft Yellow/Gold    (#FFD770)
  Background Color = Off-White/Cream     (#FDFBF7)
  Dark Emerald     = Very Dark Green     (#002b21)
  Gold Color       = Rich Gold           (#EFBF04)
  Font Family      = Times New Roman

RULE: Any element with the class "hidden":
  - Make it completely invisible AND remove it from the page layout

LOGIN CARD (.Loginuser):
  - Dark green background (#003629)
  - Rounded corners (24px radius)
  - Hovers up by 5px smoothly (0.3s transition)

EMPLOYEE INFORMATION CARD (.Employee_information):
  - GRID layout: 2 columns
  - Deep Emerald Green background (#00674F)
```

---

## FILE 3: script.js — "What Happens When You Interact"
```
SET a testing switch called MOCK_MODE = TRUE
IF MOCK_MODE is ON:
  - FAKE the network request to "/api/submit-absence"
  - Log output to console, wait 0.5s, return success

WHEN the user CLICKS "Log in":
  - Read Username and Password
  - IF Username is "admin" AND Password is "123":
      - Pop up "Login successful!"
      - HIDE login section, SHOW absence form
  - ELSE:
      - Pop up "Invalid username or password."

WHEN the user CLICKS "Submit Request":
  - Collect Name, ID, Email, Start Date, End Date, Absence Type, Reason
  - POST to http://localhost:3000/api/submit-absence as JSON
  - IF response is successful:
      - Show confirmation pop-up
      - Reset all form fields
```

---

## FILE 4: server.js — "The Background Worker"
```
LOAD express, body-parser, cors, oracledb, path

CONFIGURE database connection:
  - Username: C##ABSENCEREQUESTFORM
  - Address: localhost:1521/orcl

ROUTE POST "/api/submit-absence":
  - Unpack Name, ID, Email, Start Date, End Date, Type, Reason
  - Validate Employee ID is a number
  - Connect to Oracle Database
  - Insert record into REQUESTINFO table using SQL parameter binding
  - Commit transaction and respond with success
  - Close database connection safely
```

---

### C. Employee Performance Review Schema (`PerformanceReview`)
* **Classification**: Object / Record Structure
* **Purpose**: Holds executive evaluation scores, compensation metrics, and review statuses for HR and CEO oversight (`PERFORMANCE_REVIEWS` Oracle table).

| Field Name | Data Type | Description | Constraints / Validation |
| :--- | :--- | :--- | :--- |
| `reviewId` | Number | Primary key identifier | Auto-generated ID |
| `empId` | Number | Associated Employee ID | Required |
| `employeeName` | String | Employee full name | Required |
| `department` | String | Department (e.g. Engineering) | Required |
| `position` | String | Position Title | Required |
| `salary` | Number | Monthly gross compensation ($) | Required, positive number |
| `rating` | Number | Score out of 5.0 | Range: 1.0 to 5.0 |
| `status` | String | Evaluation status | `Completed`, `Pending Review`, `Under Review` |
| `reviewer` | String | Executive reviewer role | `CEO`, `HR Manager` |
| `feedback` | String | Executive feedback notes | Optional |

---

### B. Executive Salary & Bonus Recommendation Logic
* **Algorithm**: Conditional Compensation Metric Classifier
* **Data Structure Involved**: Reads employee rating from performance array and classifies bonus tier.

```text
PROCEDURE CalculateExecutiveBonus(employee_rating)
    IF employee_rating >= 4.5 THEN
        RETURN "+15% Salary Raise & Annual Bonus" (High Performer)
    ELSE IF employee_rating >= 4.0 THEN
        RETURN "+8% Standard Annual Increase" (Strong Contributor)
    ELSE IF employee_rating >= 3.5 THEN
        RETURN "Standard Compensation Rate" (Meeting Expectations)
    ELSE
        RETURN "Performance Improvement Plan (PIP) Required"
```

---

# PART 3: Full User Journey Walkthrough

```text
1. Employee or Executive opens the application in their web browser.
2. User selects Quick Role Preset (CEO, HR Manager, Branch Manager, or Employee) or inputs credentials.
3. script.js validates credentials against Oracle DB (or presentation fallback) and sets role permissions.
4. If logged in as CEO or HR:
   - Full access to Absence Dashboard (charts, KPIs, status chips, CSV exports).
   - Full access to Performance Dashboard (department payroll charts, ratings breakdown, executive bonus calculations, and new review creation).
5. If logged in as Manager:
   - Access restricted to own branch request reviews (Phnom Penh).
6. If logged in as Employee:
   - Access limited to Absence Request Submission form and "My Requests" status board.
7. Any submitted absence request or performance evaluation is committed directly to Oracle DB tables (`REQUESTINFO` & `PERFORMANCE_REVIEWS`).
```

---
*End of Combined Pseudocode and Technical Report*
