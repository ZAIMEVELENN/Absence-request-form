# ZILK ATELIER — Absence Request Form
## Plain-Language Pseudocode (for everyone, no coding knowledge needed)

> This document explains every part of the project in simple, everyday language.
> Think of it as a "story" of how the website works, step by step.

---

## PROJECT OVERVIEW

This project is a **website** that allows employees of ZILK ATELIER to:
1. **Log in** using their username and password
2. **Fill out a form** to request a day(s) off from work
3. **Submit that form** so that the data gets saved into a company database
4. A **server running in the background** handles saving the data safely

The project is made up of **4 files** that each play a different role:

| File        | Role                                                                 |
|-------------|----------------------------------------------------------------------|
| `index.html` | The **structure** — what you actually see on screen (pages, buttons, fields) |
| `style.css`  | The **appearance** — colors, fonts, sizes, spacing, hover effects   |
| `script.js`  | The **behavior** — what happens when you click buttons or submit forms |
| `server.js`  | The **brain in the background** — receives the form data and saves it to the database |

---

---

# FILE 1: index.html — "What the User Sees"

> This file is like the **blueprint of a building**. It describes every room (section),
> every door (button), and every sign (label) on the website.

---

## PAGE SETUP (The Head)

```
BEFORE the page is shown to the user:
  - Set the page title to "Absence Request Form"
    (This appears on the browser tab)

  - Tell the browser this page is in English

  - Make the page look good on mobile phones too
    (Do not zoom out — keep text a readable size)

  - Load the visual styling file: style.css
    (This is like telling the building "use this color palette and furniture style")

  - Set the browser tab icon to the company logo (ZILK_LOGO.png)
```

---

## PAGE CONTENT (The Body — What You See)

The page has **3 major sections**. Only ONE is visible at a time.

---

### SECTION 1: Login Form (`id="LoginForm"`)

> This is the **first screen** the user sees when they open the website.
> It is like the **front door** — you must prove who you are before going inside.

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
      (placeholder hint text: "User")

    - Show a label: "Password :"
    - Show a password input box (text is hidden as dots)
      (placeholder hint text: "Password")
      (this field is REQUIRED — cannot be left empty)

    - Show 3 buttons side by side:
        1. "Log in"         → triggers the login check (explained in script.js)
        2. "Sign up"        → button exists but has no action yet (future feature)
        3. "Forget Password" → button exists but has no action yet (future feature)
```

---

### SECTION 2: Absence Request Form (`id="container1"`)

> This section is **hidden** when the page first loads.
> It only appears **after the user successfully logs in**.
> This is the **main working area** — where employees fill in their request.

```
DISPLAY the main form area (only shown after login):

  TOP HEADER BAR:
    - Show company logo and name again (same as login screen)
    - Show a navigation bar (currently all links are commented out / hidden
      because the live data feature is not ready yet)

  WARNING NOTE (in red text):
    - "Please submit this form at least 2 weeks before the request date,
       any less will be denied."

  --- EMPLOYEE INFORMATION SECTION (green background card) ---

    - Label + Input: "Employee Name"
      (text box — the employee types their full name)
      (REQUIRED — cannot be left empty)

    - Label + Input: "Employee ID"
      (number box — the employee types their ID number)
      (REQUIRED — cannot be left empty)

    - Label + Input: "Employee Email"
      (email box — the employee types their work email)
      (REQUIRED — must follow email format like name@company.com)

  --- ABSENCE INFORMATION SECTION (green background card) ---

    DATE SUBSECTION (left side):
      - Label + Date Picker: "Start Date"
        (employee picks the first day they will be absent)
        (REQUIRED)

      - Label + Date Picker: "End Date"
        (employee picks the last day they will be absent)
        (REQUIRED)

      - Label + Dropdown Menu: "Type of Absence"
        (employee chooses ONE from these options:)
          • [Select an option]  ← default, empty selection
          • Sick Leave
          • Vacation
          • Personal Leave
          • Other
        (REQUIRED — must pick one)

    REASON & DOCUMENT SUBSECTION (right side):
      - Label + Large Text Box: "Reason for Absence"
        (employee writes a detailed explanation of why they need to be absent)
        (REQUIRED — cannot be left empty)
        (the box can be resized vertically by dragging)

      - Label + File Upload Area: "Supporting Document (optional)"
        (employee can attach a file, for example a doctor's note or letter)
        (This is OPTIONAL — not required)
        (Displayed as a dark box with an upload icon and the text
         "Click to upload image")

      - Button: "Submit Request"
        (clicking this sends all the filled-in data to the server)

  BOTTOM NOTE (small text):
    - "NOTE: AFTER SUBMISSION, THE REQUEST WILL BE SENT TO THE MANAGER
       FOR APPROVAL. YOU CAN CHECK THE STATUS OF YOUR REQUEST IN THE
       'MY REQUESTS' SECTION."
```

---

### SECTION 3: Request Preview Table (`id="ReqFormReview"`)

> This section is also **hidden** by default.
> It is designed to show a **table of submitted requests** in the future.
> Currently the table body is empty — data will be inserted here later
> when the live database connection feature is completed.

```
DISPLAY a preview table (hidden for now, planned for future):

  Title: "Request Preview"

  TABLE with these column headers:
    | Name | ID | Start Date | End Date | Status | Reason |

  TABLE BODY:
    (empty — no data is shown yet, waiting for backend data feature)
```

---

### SCRIPT CONNECTION (Bottom of the page)

```
AFTER all sections are loaded:
  - Connect and load the JavaScript file: script.js
    (Important: this is placed at the VERY BOTTOM of the page
     to make sure the whole page is fully built before the
     script tries to interact with it)
```

---
---

# FILE 2: style.css — "How Everything Looks"

> CSS is like an **interior designer's instruction book**.
> It tells the browser: "make this element this color, this size, in this position."
> No logic here — only visual rules.

---

## COLOR & FONT SYSTEM (Design Tokens)

```
DEFINE a set of shared colors and fonts for the whole site:

  Primary Color    = Deep Emerald Green  (#00674F)
  Secondary Color  = Soft Yellow/Gold    (#FFD770)
  Accent Color     = Red                 (#e74c3c)  ← used for warnings
  Background Color = Off-White/Cream     (#FDFBF7)
  Text Color       = Black               (#000000)
  Dark Emerald     = Very Dark Green     (#002b21)
  Gold Color       = Rich Gold           (#EFBF04)
  Font Family      = Times New Roman (classic, formal look)
```

---

## HIDDEN CLASS RULE

```
RULE: Any element with the class "hidden":
  - Make it completely invisible AND remove it from the page layout
  - (It takes up no space at all — it simply does not exist visually)
  - The "!" means this rule cannot be overridden by other rules
```

---

## LOGIN SCREEN STYLES

```
LOGIN FORM BOX (#LoginForm):
  - Background: Gold/Yellow color
  - Border style: Groove (a 3D-looking border)
  - Maximum width: 800px (won't stretch too wide on big screens)
  - Height: 800px (fixed tall box)
  - Centered on the page automatically

BRAND HEADER (company logo + name strip):
  - Display logo and text side-by-side (horizontal row)
  - Background: Very Dark Green (#002b21)
  - Maximum width: 400px, centered
  - Has a small gap between logo and text

  Company Name (h1): Scales fluidly between 1.2rem and 2.2rem
    depending on screen size (so it looks good on phones AND desktops)

  Subtitle (h2): Smaller, scales between 0.85rem and 1.3rem
    No bold — looks lighter/secondary

GREETING TEXT (.greeting):
  - Centered on the page
  - Small padding below

"LOGIN" HEADING (#Login-Heading):
  - Gold color text
  - Font size: 31px
  - Centered

LOGIN CARD (.Loginuser — the dark green card):
  - Stack items vertically (column direction)
  - Dark green background (#003629)
  - Rounded corners (24px radius — very rounded)
  - Soft shadow underneath (gives it a "floating" effect)
  - Maximum width: 420px, centered with 40px top spacing
  - Generous padding (3em — lots of breathing room inside)

  HOVER EFFECT on the login card:
    - The card moves UP by 5 pixels when you hover over it
    - The shadow gets stronger and spreads more
    - Transition is smooth (0.3 seconds)

  LABELS inside the card:
    - Bold, 18px, Gold color

  INPUT BOXES inside the card:
    - Full width of the card
    - 18px font size, good padding

BUTTONS (Log In / Sign Up / Forgot Password):
  - All displayed in a centered row with gaps between them

  "Log In" button (.signin):
    - Width: 100px, Height: 32px
    - Background: Deep Emerald Green, text: Gold color
    HOVER: Background becomes Very Dark Green, text becomes White

  "Sign Up" button (.signup):
    - Same size and colors as "Log In"
    HOVER: Same as "Log In"

  "Forget Password" button (.iforgot):
    - Slightly wider: 140px
    - Spans full width of the row (stacks below the other two on small screens)
    - Smooth 0.4 second color transition
    - Background: Deep Emerald Green, text: Gold
    HOVER: Very Dark Green background, White text
```

---

## GLOBAL STYLES (Apply to Everything)

```
ALL elements on the page (*):
  - Remove any default spacing (margin = 0, padding = 0)
  - Use Times New Roman font
  - Automatically capitalize the first letter of every word
  - Use "border-box" sizing (padding is included inside the element's width)

BODY (the entire page):
  - White background
  - Padding that scales: between 16px on small screens, up to 60px on large screens
```

---

## ABSENCE FORM SECTION STYLES

```
MAIN CONTAINER (#container1):
  - Display as a block (takes up full width)
  - 1rem margin on all sides

PROFILE HEADER BAR (.profile-header):
  - Green silky fabric texture image as background,
    layered over a diagonal green gradient (dark to darker green)
  - Maximum width: 800px, centered on page
  - Rounded corners (12px)
  - Subtle shadow (gives premium look)
  - Black solid border
  - 30px space below (separates header from the form)

COMPANY LOGO BOX (.CompanyLogo):
  - Fixed 120px × 120px square
  - Gold border (2px solid)
  - Logo image fills the box completely (cover fit)

HEADER TEXT (.Headertext):
  - Gold color with a subtle black text shadow (1px offset — readable on dark BG)
  - Left-aligned

BRAND (.brand — logo + header grouped):
  - Side by side (flex row)
  - 0.75rem gap between logo and text

NAVIGATION BAR (.navnar):
  - Side by side row, centered
  - Transparent background, no border

  NAVIGATION LINKS (.navnar a):
    - Gold text color
    - Slight dark background tint
    - Rounded corners (8px)
    - No underline
    - Smooth 160ms transition for color and 120ms for movement

    HOVER on links:
      - Gold border appears
      - Text turns white
      - Link moves up 2px (subtle lift effect)

WARNING NOTE (.ExtraNote):
  - Red text, 18px font size

ABSENCE FORM WRAPPER (#absenceRequestForm):
  - Off-white/cream background (#FDFBF7)
  - Thin black border (1px solid)

EMPLOYEE INFORMATION CARD (.Employee_information):
  - GRID layout: 2 columns
    Column 1 = label (just wide enough for the text)
    Column 2 = input box (fills remaining space)
  - 15px gap between rows, 10px between columns
  - Deep Emerald Green background (#00674F)
  - 5px rounded corners
  - 15px inner padding
  - 30px space below (separates from the next section)

  Labels inside: Bold, 18px, Gold color
  Input boxes inside: Full width, max 413px, 18px font

ABSENCE INFO SECTION (.AbsentInfoSection):
  - Single column grid layout
  - Deep Emerald Green background, same style as above
  - 15px gap, 5px rounded corners, 15px padding

  DATE SUBSECTION (.datesection):
    - 2-column grid
      Column 1 = 220px wide (label)
      Column 2 = fills remaining space (input)

  Labels: Bold, 18px, Gold, minimum 220px wide
  Inputs and Select dropdowns: 18px, minimum 40px tall, max 400px wide

REASON TEXT BOX (#reason):
  - Max width 400px, minimum height 200px
  - 18px font
  - User can RESIZE it vertically by dragging the bottom edge

FILE UPLOAD AREA (.custum-file-upload):
  - Dark box: 200px tall × 300px wide
  - Very Dark Green background (#002b21)
  - Dashed white/light border (2px dashed)
  - Rounded corners (10px)
  - Icon (SVG upload graphic) and text "Click to upload image" centered inside
  - The actual file <input> is invisible — clicking the box triggers the file chooser

  UPLOAD ICON (.icon svg):
    - 80px tall, light grey/white fill color

  UPLOAD TEXT (.text span):
    - Light grey/white color, normal font weight

SUBMIT BUTTON (inside .specifyingdateandreason):
  - Background: Gold (#EFBF04)
  - Text: Deep Green (#00674F)
  - Bold, 16px, 5px rounded corners
  - Smooth 160ms hover transition
  HOVER: Gold becomes darker (#d4a803)

BOTTOM NOTE (.Note1):
  - Small font size
  - ALL CAPS (text-transform: uppercase)

RESPONSIVE DESIGN — Mobile screens (768px or narrower):
  The form switches from 2-column layout to 1-column layout
  (Everything stacks vertically instead of side by side)
  Reason text box becomes full width
```

---
---

# FILE 3: script.js — "What Happens When You Interact"

> JavaScript is the **interactive brain** of the website.
> It watches for user actions (like clicking a button) and responds to them.

---

##  MOCK MODE SETTING

```
SET a testing switch called MOCK_MODE = TRUE

PURPOSE: This switch lets developers test the form
WITHOUT needing the backend server to be running.

IF MOCK_MODE is ON (true):
  Secretly replace the real "send data to server" action with a FAKE one:

  WHEN the form tries to send data to "/api/submit-absence":
    - Print a message in the developer console showing what data would have been sent
    - Wait 0.5 seconds (to pretend there is a real network delay)
    - Return a fake successful response: { success: true }
    - (The real server is never actually contacted)

  For any other web requests: use the normal, real method
```

---

## WAIT FOR PAGE TO FINISH LOADING

```
WAIT until the entire HTML page is fully loaded and ready.
REASON: We must wait because the script needs to find buttons and input boxes
by their names. If the page hasn't finished building yet, those elements
don't exist and the script will crash.

AFTER the page is fully ready → run everything below:
```

---

##  PART 1: LOGIN CHECK

```
FIND the "Log in" button on the page.

IF the "Log in" button exists:

  SET UP a listener: "Watch this button for clicks"

  WHEN the user CLICKS the "Log in" button:

    Step 1: Prevent the page from refreshing
            (Normally a button inside a form refreshes the page — we stop that)

    Step 2: Read what the user typed into the username box
    Step 3: Read what the user typed into the password box

    Step 4: CHECK if the credentials are correct:
              username = "admin"  AND  password = "123"

              IF BOTH are correct:
                - Show a pop-up: "Login successful!"
                - HIDE the login screen (add "hidden" class to the login section)
                - SHOW the absence request form (remove "hidden" class from container1)

              IF the credentials are WRONG:
                - Show a pop-up: "Invalid username or password."
                - Do nothing else — user stays on the login screen
```

---

##  PART 2: FORM SUBMISSION

```
FIND the absence request form on the page.

IF the form exists:

  SET UP a listener: "Watch this form for submission attempts"

  WHEN the user CLICKS "Submit Request":

    Step 1: Prevent the default browser behaviour
            (Without this, the page would refresh and all data would be lost)

    Step 2: COLLECT all the data the user typed into the form:
              - Employee Name      (from the "employeeName" input box)
              - Employee ID        (from the "employeeId" input box)
              - Employee Email     (from the "EmployeeEmail" input box)
              - Start Date         (from the "startDate" date picker)
              - End Date           (from the "endDate" date picker)
              - Absence Type       (from the "absenceType" dropdown menu)
              - Reason             (from the "reason" text area)

    Step 3: TRY to send all this collected data to the server:
              - Send it to: http://localhost:3000/api/submit-absence
              - Send it as a POST request (meaning: "I am giving you new data")
              - Package the data as JSON format (a structured text format)
              - Wait for the server to respond...

    Step 4: READ the server's response:

              IF the server says "success = true":
                - Show a pop-up thanking the employee and asking them to
                  wait for an email within 48 hours.
                  (Contact number provided: +855 8965 4048 if no reply)
                - CLEAR all the form fields back to empty
                  (So the form is ready for the next submission)

              IF the server says "success = false":
                - Show a pop-up: "Submission failed: [error message from server]"

    Step 5 (SAFETY NET): IF something goes wrong and we cannot even reach the server:
              - Print the error details in the developer console (for debugging)
              - Show a pop-up: "Could not reach the server. Make sure your
                node application is active."
```

---
---

#  FILE 4: server.js — "The Background Worker"

> The server is like a **post office** that runs separately in the background.
> It receives packages (form data) from the website, processes them,
> and stores them safely in the company database.
> Employees never see this — it runs invisibly on the company's computer.

---

##  TOOLS THE SERVER USES (Libraries)

```
LOAD the following helper tools:
  - express    → Framework that lets us easily create a web server
  - body-parser → Tool that unpacks/reads the data sent from the website
  - cors        → Tool that allows the website (on a browser) to talk to this server
                  (Normally browsers block this for security — cors unlocks it)
  - oracledb    → Tool that lets the server talk to the Oracle database
  - path        → Tool for working with file and folder locations

CREATE the server application (called "app")
```

---

##  SERVER CONFIGURATION

```
CONFIGURE the server:
  - Teach it to understand JSON data (the format the website sends)
  - Allow cross-origin requests (so the browser can communicate with this server)
  - Serve all the website files (HTML, CSS, JS) automatically from this folder

SET the Oracle Database connection details:
  - Username: C##ABSENCEREQUESTFORM
  - Password: 123
  - Address:  localhost:1521/orcl
    (This means the database is running on the same computer, port 1521)
```

---

##  SERVER ROUTES (What the Server Responds To)

> A "route" is like a specific address the server listens at.
> Different routes handle different requests.

---

### Route 1: Homepage (`GET /`)

```
WHEN someone visits the website address (e.g. http://localhost:3000):
  → Send them the index.html file
    (This loads the entire website in their browser)
```

---

### Route 2: General Database Query (`POST /query`)

```
WHEN a request arrives at "/query" containing a custom SQL command:

  Step 1: Open a connection to the Oracle database
  Step 2: Run the SQL command against the database
  Step 3: Send the results back as a response
  Step 4: Close the database connection

  IF anything goes wrong at any step:
    → Send back an error message (status code 500 = server error)

  ALWAYS (even if something went wrong):
    → Make sure the database connection is properly closed
      (Leaving connections open wastes resources and causes problems)
```

---

### Route 3: Test Database Connection (`testConnection` function)

```
FUNCTION: Test if the database is reachable

  Step 1: Try to open a connection to the Oracle database
  Step 2: IF successful → print ✅ "Successfully connected to Oracle Database"
          IF failed     → print ❌ "Database connection failed" + the error reason

  Step 3: Always close the connection afterwards
```

---

### Route 4: START THE SERVER

```
START listening for requests on Port 3000
  (Port 3000 is like a specific "channel" the server monitors)

WHEN the server successfully starts:
  - Print "Server is running on port 3000"
  - IMMEDIATELY run the testConnection() function to confirm the database is ready
```

---

### Route 5: Handle Absence Form Submissions (`POST /api/submit-absence`)

> This is the **most important route** — it receives the form data from the user
> and saves it permanently into the Oracle database.

```
WHEN the website sends absence form data to "/api/submit-absence":

  Step 1: UNPACK the incoming data into individual pieces:
            - Employee Name
            - Employee ID
            - Employee Email
            - Start Date
            - End Date
            - Absence Type
            - Reason for Absence

  Step 2: VALIDATE the Employee ID:
            Convert it to a number.
            IF it is not a valid number, OR if it is blank:
              → Reject the request immediately
              → Send back: "Employee ID must be a valid number."
              → Stop processing — do not continue to the database

  Step 3: TRY to open a connection to the Oracle database

  Step 4: BUILD a database save command (SQL INSERT):

            Save a new record into the REQUESTINFO table with:
              - REQUEST_ID      → auto-generated (next number in sequence)
              - EMPLOYEE_NAME   → from the form
              - EMPLOYEE_ID     → validated number from the form
              - EMPLOYEE_EMAIL  → from the form
              - START_DATE      → converted from text to a real date
              - END_DATE        → converted from text to a real date
              - ABSENCE_TYPE    → from the form
              - REASON_FOR_ABSENCE → from the form

            Use placeholders (:1, :2, :3...) instead of putting values directly
            into the command. This is a SECURITY MEASURE to prevent "SQL injection"
            attacks (a type of hacking).

  Step 5: EXECUTE the save command with autoCommit = true
            (autoCommit = "save it permanently right now" — 
             without this, Oracle holds the change temporarily and might discard it)

  Step 6: IF the save was successful:
            → Send back: { success: true, message: "Absence request submitted!" }

          IF anything went wrong:
            → Print ❌ "Database insertion failed" + the error reason (in server logs)
            → Send back: { success: false, error: [error description] }

  Step 7 (ALWAYS — cleanup):
            → Close the database connection regardless of success or failure
```

---
---

#  FULL JOURNEY: What Happens from Start to Finish

> Here is the complete story of one employee using the system:

```
1. Employee opens the website in their browser
     → Server receives the request and sends back: index.html + style.css + script.js
     → Browser builds and displays the Login Screen

2. Employee sees a gold/yellow login page with the ZILK ATELIER logo
   and a dark green login card

3. Employee types:
     Username: admin
     Password: 123
   Then clicks "Log in"

4. script.js checks the credentials:
   → They match! 
   → Login screen disappears (becomes hidden)
   → Absence Request Form appears (hidden class is removed)

5. Employee fills in the form:
     - Their name, ID, and email (in the green employee info card)
     - Start date and end date using date pickers
     - Choose absence type from the dropdown (e.g. Sick Leave)
     - Write a reason in the text area
     - Optionally attach a document (e.g. doctor's note)

6. Employee clicks "Submit Request"

7. script.js collects all the data and sends it to:
   http://localhost:3000/api/submit-absence

8. server.js receives the data:
     - Validates the Employee ID is a number ✅
     - Connects to Oracle Database ✅
     - Saves the record into the REQUESTINFO table ✅
     - Closes the database connection ✅
     - Sends back: { success: true }

9. script.js receives the success response:
     - Shows pop-up: "Thanks for submitting! Expect an email within 48 hours."
     - Clears all form fields (ready for next use)

10. The manager can later review the saved request in the database
    and approve or reject it (this review feature is planned for the future)
```

---

# FILE SUMMARY TABLE

| File        | Plain-English Role                     | When It Runs                         |
|-------------|----------------------------------------|--------------------------------------|
| `index.html` | Builds the visual structure of the page | When the browser loads the website   |
| `style.css`  | Makes everything look good (colors, layout) | Applied automatically when page loads |
| `script.js`  | Handles login check and form submission | Runs when user clicks buttons         |
| `server.js`  | Receives data and saves it to database | Runs continuously in the background   |

---

*End of Pseudocode Document — ZILK ATELIER Absence Request Form*
*Made with Antigravity CLI model claud sonnet 4.6 agent.