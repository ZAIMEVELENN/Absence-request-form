# Data Structure and Pseudocode Report

This report outlines the data structures, validation rules, and pseudocode logic for the **Absence Request Form** web application.

---

## 1. Data Structures

The system handles two primary collections of data: **User Authentication Data** and **Absence Request Data**.

### A. User Authentication Schema (`User`)
This structure represents a user account within the system.

| Field Name | Data Type | Description | Constraints / Validation |
| :--- | :--- | :--- | :--- |
| `username` | String | Unique username for logging in | Required, case-insensitive, minimum 4 characters |
| `password` | String | User's security credentials | Required |

### B. Absence Request Schema (`AbsenceRequest`)
This structure holds all details associated with a single absence submission.

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

## 2. Pseudocode Logic

### A. Login Authentication Logic
Handles user validation when the user clicks the "Log in" button.

```text
PROCEDURE AuthenticateUser(username, password)
    // Step 1: Check if inputs are empty
    IF username is empty OR password is empty THEN
        DISPLAY "Please enter both username and password."
        RETURN FALSE
    END IF

    // Step 2: Validate against user database (hardcoded for now)
    IF username EQUALS "admin" AND password EQUALS "123" THEN
        DISPLAY "Login successful!"
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
Validates compliance with the submission deadline (at least 2 weeks in advance) and proper date ranges before submission.

```text
PROCEDURE SubmitAbsenceRequest(requestData)
    // Step 1: Validate Date Sequence
    IF requestData.startDate > requestData.endDate THEN
        DISPLAY "Error: End Date cannot be before Start Date."
        RETURN FALSE
    END IF

    // Step 2: Enforce the "2 weeks in advance" rule
    currentDate = GET_CURRENT_DATE()
    twoWeeksFromNow = currentDate + 14 days

    IF requestData.startDate < twoWeeksFromNow THEN
        DISPLAY "Error: Requests must be submitted at least 2 weeks in advance."
        RETURN FALSE
    END IF

    // Step 3: Validate Email format
    IF NOT IsValidEmail(requestData.employeeEmail) THEN
        DISPLAY "Error: Invalid email format."
        RETURN FALSE
    END IF

    // Step 4: Submit request
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
Checks whether a string has a valid email structure.

```text
FUNCTION IsValidEmail(email)
    IF email matches pattern "^[^@]+@[^@]+\.[^@]+$" THEN
        RETURN TRUE
    ELSE
        RETURN FALSE
    END IF
END FUNCTION
```
