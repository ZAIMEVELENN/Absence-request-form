const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const oracledb = require('oracledb');
const path = require('path');

const app = express();

// Middleware configuration
app.use(bodyParser.json());
app.use(cors());

// Serve static frontend files automatically
app.use(express.static(__dirname));

// Oracle database configuration
const config = {
  user: 'C##ABSENCEREQUESTFORM',
  password: '123',
  connectString: 'localhost:1521/orcl' 
};

// Default route to serve your user interface
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Database interactive query route
app.post('/query', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(config);
    const result = await connection.execute(req.body.sql);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
});

// Function to immediately test database connectivity on launch
async function testConnection() {
  let connection;
  try {
    connection = await oracledb.getConnection(config);
    console.log('✅ Success! Successfully connected to the Oracle Database.');
  } catch (err) {
    console.error('❌ Database connection failed Error: ', err.message);
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
}

// Start the server listener
app.listen(3000, () => {
  console.log('🚀 Server is running on port 3000');
  testConnection(); // Triggers the test right after startup logs
});

// Route to handle absence form submissions
app.post('/api/submit-absence', async (req, res) => {
  let connection;
  
  // Destructure the data fields sent from the frontend script
  const { employeeName, employeeId, employeeEmail, startDate, endDate, absenceType, reason } = req.body;

  // Validate employeeId to prevent NJS-105 (NaN) database insertion failure
  const numericEmployeeId = Number(employeeId);
  if (isNaN(numericEmployeeId) || employeeId.trim() === '') {
    return res.status(400).json({ success: false, error: "Employee ID must be a valid number." });
  }

  try {
    connection = await oracledb.getConnection(config);

    // SQL query using bind variables (:1, :2, etc.) for database security
    const sql = `
      INSERT INTO REQUESTINFO (
        REQUEST_ID, EMPLOYEE_NAME, EMPLOYEE_ID, EMPLOYEE_EMAIL, 
        START_DATE, END_DATE, ABSENCE_TYPE, REASON_FOR_ABSENCE
      ) VALUES (
        req_id_seq.NEXTVAL, :1, :2, :3, TO_DATE(:4, 'YYYY-MM-DD'), TO_DATE(:5, 'YYYY-MM-DD'), :6, :7
      )
    `;

    // Execute statement with values array mapped to the bind variables
    await connection.execute(
      sql,
      [employeeName, numericEmployeeId, employeeEmail, startDate, endDate, absenceType, reason],
      { autoCommit: true } // Crucial: Ensures Oracle saves the transaction permanently!
    );

    res.json({ success: true, message: "Absence request submitted successfully!" });

  } catch (err) {
    console.error("❌ Database insertion failed:", err.message);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
});