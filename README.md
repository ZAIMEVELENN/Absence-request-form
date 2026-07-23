to do 

## 🚀 Project Progress & Roadmap

### Done (Completed)
- [x] Architected the system and basic layout
- [x] Converted `<section class="...">` to unique `<section id="...">` for DOM targeting
- [x] Created the login section inside the `<body>`
- [x] Made the login page work (Username: `admin` / Password: `123`)
- [x] Implemented the submit button with validation logic
- [x] Added success/failure pop-up alerts (handling invalid files/inputs)

### ⏳ To Do (Upcoming)
- [ ] Make sign up work
- [ ] Polish the UI/UX design
- [ ] Learn JavaScript


## Pseudo code
### to write a type like code that even normal people ( people who doesn't study programming) able to understand the code

### Pseudo code with JAVA-SCRIPT
 
    ``Wait for the website to load all the content before letting user run the login or use any feature
        Class sign in button 
        
        If user click login in button
            If click
                Grab data when user input of Username
                Grab data when user input of Password
            If User is "admin" and Password is 123
                Alert the user " Login successful "

                    Then hide the login form & show the page
            Else the password is wrong 
                Show Invalid username or passwpord.


    ``

---

## 🛠️ Recent Updates (June 25, 2026)

### Fixed Database Insertion Crashes (`NJS-105: value is not a number (NaN)`)
- **Backend Parameter Validation:** Added checks in [server.js](file:///D:/File%20for%20coding%20stuff/_Project/Front-end-project/Absence_Request_Form/server.js) to validate if the `employeeId` parameter can be parsed to a valid number. Returns a clean HTTP `400 Bad Request` if invalid input (like `B20245631`) is submitted.
- **Strict Frontend Type Constraints:** Updated the `Employee ID` input field in [index.html](file:///D:/File%20for%20coding%20stuff/_Project/Front-end-project/Absence_Request_Form/index.html) from `type="text"` to `type="number"`.
- **Integration Tests:** Verified the validation logic behaves correctly when:
  - Sent non-numeric ID strings (like `B20245631`): correctly returned a validation error.
  - Sent valid numeric ID strings (like `1234`): successfully passed to Oracle Database (caught `ORA-02289` sequence missing error as expected, confirming parameter binding was correct).
  - Server is offline: verified offline connection refusal.


AI Tool/model that is used in this project

-gemini 3.5

-github copilot auto

-qwen 2.5 coder B70


NEW TASK ( MUST DO )

_ CREATE AN HIREARCHY ACCOUNT _

#### ( CEO > HR > MANAGER > EMPLOYEE)
PERMISSION
>CEO = ABLE TO OVERRITE NEARLY ALL OF THE DATA ( NOT TO ADMIN LEVEL)

>HR = ABLE TO APPROVE REQUEST OR REJECTED THE REQUEST ABLE TO CHANGE THE START AND END DATE TO THE REUEST

MANAGER = ABLE VIEW ALL EMPLOYEE REQUEST AND TO APPROVE REQUEST OR REJECT THE REQUEST BUT MUST HAVE A CONVERSATION ON CHANGING TO OTHER DAY ( MANAGER CAN'T CHANGE DAY BY THEMSELVE ) >THEREFORE THEY MUST TALK WITH EMPLOYEE WITH AGREEING DATE THEN CONTACT THE HR DEPARTMEMT

>EMPLOYEE = ABLE TO MAKE REQUEST VIEW THEIR OWN REQUEST ONLY

_CREATE A DATA FOR MORE DEPARTMENT AND BRANCH_

> LETTING MANAGER ONLY ABLE TO VIEW THEIR OWN BRANCH AND VIEW THEIR OWN BRANCH

> HEAD MANAGER HAVING CONTROL ALL THE BRANCH

_CREATE EMPLOYEE DATA WHERE EMPLOYEE CAN SIGN UP TO MAKE AN ACCOUNT_

_CEO ABLE TO GRANT ROLE TO SOMEONE AS HR AND ALL OTHER ROLE_

_HR ABLE TO GRANT HEAD-MANAGER, MANAGER AND EMPLOYEE TO ALL OTHER ROLE SUCH FINACE, IT. ETC._
