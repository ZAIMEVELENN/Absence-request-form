const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const oracledb = require('oracledb');
const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config();

const SALT_ROUNDS = 10;

const app = express();

// Middleware configuration
app.use(bodyParser.json());
app.use(cors());

// Database-backed user roles
const reviewRoles = ['CEO', 'HR', 'MANAGER'];
// NOTE: Status is now stored directly in the Oracle DB — no in-memory Map needed.
const TEMP_REQUEST_BRANCH = 'Phnom Penh';

// Serve static frontend files automatically
app.use(express.static(__dirname));

// Oracle database configuration
const config = {
  user: process.env.DB_USER || process.env.ORACLE_USER || 'C##ABSENCEREQUESTFORM',
  password: process.env.DB_PASSWORD || process.env.ORACLE_PASSWORD || '123',
  connectString: process.env.DB_CONNECT_STRING || process.env.ORACLE_CONNECT_STRING || 'localhost:1521/orcl'
};

// Default route to serve your user interface
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Helper function to map database roles to application roles
function mapRole(dbRoleName, username) {
  const userUpper = (username || '').toUpperCase();
  if (userUpper === 'ZAIMEVELENN') {
    return 'CEO';
  }
  let appRole = 'EMPLOYEE';
  const dbRoleUpper = (dbRoleName || '').toUpperCase();
  if (dbRoleUpper === 'CEO') {
    appRole = 'CEO';
  } else if (dbRoleUpper === 'HUMAN RESOURCE' || dbRoleUpper === 'HR') {
    appRole = 'HR';
  } else if (dbRoleUpper === 'MANAGER' || dbRoleUpper === 'GENERAL MANAGER') {
    appRole = 'MANAGER';
  }
  return appRole;
}

// Helper function to normalize branch names
function mapBranch(appRole, dbBranchName) {
  if (appRole === 'CEO' || appRole === 'HR') {
    return 'ALL';
  }
  let appBranch = dbBranchName || 'Phnom Penh';
  if (appBranch.replace(/\s+/g, '').toLowerCase().includes('phnompenh')) {
    return 'Phnom Penh';
  }
  return appBranch;
}

// Login route: the server verifies credentials against Oracle Database.
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  console.log(`[LOGIN ATTEMPT] username: "${username}"`);
  let connection;

  try {
    connection = await oracledb.getConnection(config);
    const result = await connection.execute(
      `SELECT e.EMP_ID, e.USERNAME, e.PASSWORD, r.ROLE_NAME, b.BRANCH_NAME, e.EMAIL
       FROM EMPLOYEES e
       LEFT JOIN ROLE r ON e.ROLE_ID = r.ROLE_ID
       LEFT JOIN DEPARTMENT d ON e.DEPARTMENT_ID = d.DEPARTMENT_ID
       LEFT JOIN BRANCH b ON d.BRANCH_ID = b.BRANCH_ID
       WHERE LOWER(e.USERNAME) = LOWER(:username)`,
      [username]
    );

    console.log(`[LOGIN DB RESULT] found rows: ${result.rows.length}`);
    if (result.rows.length === 0) {
      console.log(`[LOGIN FAILED] user "${username}" not found in DB`);
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password'
      });
    }

    const [dbEmpId, dbUsername, dbPasswordHash, dbRoleName, dbBranchName, dbEmail] = result.rows[0];

    // Try bcrypt compare first (for hashed passwords), fall back to plaintext (legacy)
    let passwordMatch = false;
    try {
      passwordMatch = await bcrypt.compare(password, dbPasswordHash);
    } catch (_) {
      // hash may not be a valid bcrypt string — try plaintext
    }
    if (!passwordMatch) {
      passwordMatch = (dbPasswordHash === password);
    }

    if (!passwordMatch) {
      console.log(`[LOGIN FAILED] password mismatch for user "${dbUsername}"`);
      return res.status(401).json({
        success: false,
        error: 'Invalid username or password'
      });
    }

    const appRole = mapRole(dbRoleName, dbUsername);
    const appBranch = mapBranch(appRole, dbBranchName);
    const userEmail = dbEmail || `${dbUsername.toLowerCase()}@zilk-atelier.com`;

    res.json({
      success: true,
      user: {
        id: dbEmpId,
        username: dbUsername,
        email: userEmail,
        role: appRole,
        branch: appBranch
      }
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ success: false, error: 'Internal server error during login' });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
});// ─────────────────────────────────────────────────────────────
// SIGNUP — creates a new employee with a bcrypt-hashed password
// ─────────────────────────────────────────────────────────────
app.post('/api/signup', async (req, res) => {
  const { username, fullname, email, password } = req.body;

  // ── Server-side validation ──
  if (!username || !username.trim()) {
    return res.status(400).json({ success: false, error: 'Username is required.' });
  }
  if (username.trim().length < 3) {
    return res.status(400).json({ success: false, error: 'Username must be at least 3 characters.' });
  }
  if (!fullname || !fullname.trim()) {
    return res.status(400).json({ success: false, error: 'Full name is required.' });
  }
  if (fullname.trim().length < 2) {
    return res.status(400).json({ success: false, error: 'Full name must be at least 2 characters.' });
  }
  if (!password) {
    return res.status(400).json({ success: false, error: 'Password is required.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, error: 'Password must be at least 6 characters.' });
  }

  let connection;
  try {
    connection = await oracledb.getConnection(config);

    // ── 1. Check duplicate username ──
    const checkUser = await connection.execute(
      `SELECT EMP_ID FROM EMPLOYEES WHERE LOWER(USERNAME) = LOWER(:u)`,
      [username.trim()]
    );
    if (checkUser.rows.length > 0) {
      return res.status(400).json({ success: false, error: 'Username is already taken.' });
    }

    // ── 2. Auto-add EMP_NAME column if it doesn't exist yet ──
    let hasNameCol = false;
    try {
      await connection.execute(`SELECT EMP_NAME FROM EMPLOYEES WHERE ROWNUM = 1`);
      hasNameCol = true;
    } catch (colErr) {
      try {
        await connection.execute(
          `ALTER TABLE EMPLOYEES ADD (EMP_NAME VARCHAR2(200))`,
          [],
          { autoCommit: true }
        );
        hasNameCol = true;
        console.log('[MIGRATE] Added EMP_NAME column to EMPLOYEES table.');
      } catch (alterErr) {
        console.warn('[MIGRATE] Could not add EMP_NAME column:', alterErr.message);
      }
    }

    // ── 3. Hash the password ──
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // ── 4. Generate new EMP_ID ──
    const maxIdRes = await connection.execute(`SELECT NVL(MAX(EMP_ID), 100) + 1 FROM EMPLOYEES`);
    const newEmpId = maxIdRes.rows[0][0];

    // ── 5. Resolve default ROLE_ID (EMPLOYEE) ──
    let defaultRoleId = null;
    try {
      const roleRes = await connection.execute(
        `SELECT ROLE_ID FROM ROLE WHERE UPPER(ROLE_NAME) LIKE '%EMPLOYEE%' AND ROWNUM = 1`
      );
      if (roleRes.rows.length > 0) defaultRoleId = roleRes.rows[0][0];
    } catch (e) { /* no ROLE table — skip */ }

    // ── 6. Resolve default DEPARTMENT_ID ──
    let defaultDeptId = null;
    try {
      const deptRes = await connection.execute(
        `SELECT DEPARTMENT_ID FROM DEPARTMENT WHERE ROWNUM = 1`
      );
      if (deptRes.rows.length > 0) defaultDeptId = deptRes.rows[0][0];
    } catch (e) { /* no DEPARTMENT table — skip */ }

    const userEmail = email && email.trim()
      ? email.trim()
      : `${username.toLowerCase()}@zilk-atelier.com`;

    const empName = fullname.trim();

    // ── 7. INSERT into EMPLOYEES with hashed password ──
    if (hasNameCol) {
      await connection.execute(
        `INSERT INTO EMPLOYEES (EMP_ID, EMP_NAME, USERNAME, PASSWORD, EMAIL, ROLE_ID, DEPARTMENT_ID, JOIN_DATE, CURRENT_SALARY)
         VALUES (:1, :2, :3, :4, :5, :6, :7, SYSDATE, 200)`,
        [newEmpId, empName, username.trim(), passwordHash, userEmail, defaultRoleId, defaultDeptId],
        { autoCommit: true }
      );
    } else {
      await connection.execute(
        `INSERT INTO EMPLOYEES (EMP_ID, USERNAME, PASSWORD, EMAIL, ROLE_ID, DEPARTMENT_ID, JOIN_DATE, CURRENT_SALARY)
         VALUES (:1, :2, :3, :4, :5, :6, SYSDATE, 200)`,
        [newEmpId, username.trim(), passwordHash, userEmail, defaultRoleId, defaultDeptId],
        { autoCommit: true }
      );
    }

    console.log(`[SIGNUP] ✅ New employee inserted — ID: ${newEmpId}, Name: "${empName}", Username: "${username}"`);

    res.json({
      success: true,
      message: 'Account created successfully!',
      user: {
        id: newEmpId,
        fullname: empName,
        username: username.trim(),
        email: userEmail,
        role: 'EMPLOYEE',
        branch: 'Phnom Penh'
      }
    });

  } catch (err) {
    console.error('[SIGNUP] ❌ DB Error:', err.message);
    res.status(500).json({ success: false, error: 'Failed to create account: ' + err.message });
  } finally {
    if (connection) {
      try { await connection.close(); }
      catch (e) { console.error(e); }
    }
  }
});

// Helper function to query a user's role and branch details from the database
async function getDbUser(connection, userId) {
  if (!userId) return null;

  const result = await connection.execute(
    `SELECT e.EMP_ID, e.USERNAME, r.ROLE_NAME, b.BRANCH_NAME
     FROM EMPLOYEES e
     LEFT JOIN ROLE r ON e.ROLE_ID = r.ROLE_ID
     LEFT JOIN DEPARTMENT d ON e.DEPARTMENT_ID = d.DEPARTMENT_ID
     LEFT JOIN BRANCH b ON d.BRANCH_ID = b.BRANCH_ID
     WHERE e.EMP_ID = :empId`,
    [userId]
  );

  if (result.rows.length === 0) return null;

  const [dbEmpId, dbUsername, dbRoleName, dbBranchName] = result.rows[0];
  const appRole = mapRole(dbRoleName, dbUsername);
  const appBranch = mapBranch(appRole, dbBranchName);

  return {
    id: dbEmpId,
    username: dbUsername,
    role: appRole,
    branch: appBranch
  };
}

function canReviewRequests(user) {
  return Boolean(user && reviewRoles.includes(user.role));
}

async function getRequestInfoColumnMeta(connection) {
  const result = await connection.execute(
    `SELECT COLUMN_NAME, DATA_TYPE
     FROM USER_TAB_COLUMNS
     WHERE TABLE_NAME = 'REQUESTINFO'`
  );

  return result.rows.reduce((meta, row) => {
    meta[row[0]] = row[1];
    return meta;
  }, {});
}

async function getRequestInfoColumns(connection) {
  const meta = await getRequestInfoColumnMeta(connection);
  return new Set(Object.keys(meta));
}

async function ensureStatusColumn(connection) {
  const columns = await getRequestInfoColumns(connection);
  if (columns.has('STATUS')) {
    return false;
  }

  await connection.execute(
    `ALTER TABLE REQUESTINFO ADD (STATUS VARCHAR2(20) DEFAULT 'Pending' NOT NULL)`
  );
  await connection.execute(`COMMIT`);
  return true;
}

async function getRequestRows(connection) {
  const columnMeta = await getRequestInfoColumnMeta(connection);
  const columns = new Set(Object.keys(columnMeta));
  const hasStatus = columns.has('STATUS');
  const hasAbsenceType = columns.has('ABSENCE_TYPE');
  const reasonDataType = (columnMeta.REASON_FOR_ABSENCE || '').toUpperCase();
  const statusExpr = hasStatus ? `NVL(r.STATUS, 'Pending')` : `'Pending'`;
  const absenceTypeExpr = hasAbsenceType ? `r.ABSENCE_TYPE` : `'Other'`;
  const reasonExpr = reasonDataType === 'CLOB'
    ? `DBMS_LOB.SUBSTR(r.REASON_FOR_ABSENCE, 4000, 1)`
    : `r.REASON_FOR_ABSENCE`;

  const result = await connection.execute(`
    SELECT
      r.REQUEST_ID,
      r.EMPLOYEE_NAME,
      r.EMPLOYEE_ID,
      TO_CHAR(r.START_DATE, 'YYYY-MM-DD'),
      TO_CHAR(r.END_DATE, 'YYYY-MM-DD'),
      ${reasonExpr} AS REASON_TEXT,
      ${statusExpr} AS STATUS,
      ${absenceTypeExpr} AS ABSENCE_TYPE,
      NVL(b.BRANCH_NAME, :fallbackBranch) AS BRANCH_NAME
    FROM REQUESTINFO r
    LEFT JOIN EMPLOYEES e ON e.EMP_ID = r.EMPLOYEE_ID
    LEFT JOIN DEPARTMENT d ON d.DEPARTMENT_ID = e.DEPARTMENT_ID
    LEFT JOIN BRANCH b ON b.BRANCH_ID = d.BRANCH_ID
    ORDER BY r.START_DATE DESC
  `, { fallbackBranch: TEMP_REQUEST_BRANCH }, {
    fetchInfo: {
      REASON_TEXT: { type: oracledb.STRING, maxSize: 4000 }
    }
  });

  return result.rows.map(row => ({
    RequestId: row[0],
    Name:      row[1] || '',
    ID:        row[2] || 0,
    Branch:    row[8] || TEMP_REQUEST_BRANCH,
    Startdate: row[3] || '',
    Enddate:   row[4] || '',
    Reason:    row[5] || '',
    Status:    row[6] || 'Pending',
    absenceType: row[7] || 'Other'
  }));
}

app.get('/api/review-requests', async (req, res) => {
  const userId = Number(req.get('X-User-Id'));
  if (!userId) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  let connection;

  try {
    connection = await oracledb.getConnection(config);
    const currentUser = await getDbUser(connection, userId);

    if (!currentUser || !canReviewRequests(currentUser)) {
      return res.status(403).json({
        success: false,
        error: 'Only CEO, HR, and Manager accounts can review requests.'
      });
    }

    let requests = await getRequestRows(connection);

    if (currentUser.role === 'MANAGER') {
      requests = requests.filter(request => request.Branch === currentUser.branch);
    }

    res.json({
      success: true,
      requests
    });
  } catch (err) {
    console.error('Failed to load review requests:', err.message);
    res.status(500).json({ success: false, error: 'Failed to load review requests' });
  } finally {
    if (connection) await connection.close();
  }
});

app.post('/api/review-requests/:requestId/status', async (req, res) => {
  const userId    = Number(req.get('X-User-Id'));
  const { requestId } = req.params;
  const { status }    = req.body;
  const allowedStatuses = ['Approved', 'Rejected'];

  if (!userId) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      error: 'Status must be Approved or Rejected.'
    });
  }

  let connection;

  try {
    connection = await oracledb.getConnection(config);
    const columns = await getRequestInfoColumns(connection);
    if (!columns.has('STATUS')) {
      return res.status(400).json({
        success: false,
        error: 'STATUS column is missing in REQUESTINFO. Run /api/migrate first.'
      });
    }

    const currentUser = await getDbUser(connection, userId);

    if (!currentUser || !canReviewRequests(currentUser)) {
      return res.status(403).json({
        success: false,
        error: 'Only CEO, HR, and Manager accounts can approve or reject requests.'
      });
    }

    // Fetch the specific request to validate it exists and check branch access
    const checkResult = await connection.execute(
      `SELECT REQUEST_ID, NVL(STATUS, 'Pending') AS STATUS FROM REQUESTINFO WHERE REQUEST_ID = :id`,
      [requestId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Request not found.' });
    }

    // MANAGER branch check — hardcoded branch since REQUESTINFO has no branch column yet.
    // Update this filter once REQUESTINFO stores a real BRANCH_ID foreign key.
    if (currentUser.role === 'MANAGER' && currentUser.branch !== TEMP_REQUEST_BRANCH) {
      return res.status(403).json({
        success: false,
        error: 'Managers can only approve or reject requests from their own branch.'
      });
    }

    // ✅ KEY FIX: Write the status permanently to Oracle with autoCommit
    const updateResult = await connection.execute(
      `UPDATE REQUESTINFO SET STATUS = :status WHERE REQUEST_ID = :id`,
      { status, id: requestId },
      { autoCommit: true }  // Without this, Oracle rolls back on connection close!
    );

    if (updateResult.rowsAffected === 0) {
      return res.status(404).json({ success: false, error: 'No rows updated — request ID may be invalid.' });
    }

    console.log(`✅ Status updated: Request #${requestId} → ${status} (by user #${userId})`);
    res.json({ success: true, requestId, status });

  } catch (err) {
    console.error('❌ Failed to update request status:', err.message);
    res.status(500).json({ success: false, error: 'Failed to update request status: ' + err.message });
  } finally {
    if (connection) await connection.close();
  }
});

// ─────────────────────────────────────────────────────────────
// ONE-TIME MIGRATION HELPER
// Visit http://localhost:3000/api/migrate once to add the STATUS
// column to REQUESTINFO if it does not exist yet.
// Safe to call multiple times — it checks before altering.
// ─────────────────────────────────────────────────────────────
app.get('/api/migrate', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(config);

    const added = await ensureStatusColumn(connection);
    if (!added) {
      console.log('[MIGRATE] STATUS column already exists — no changes made.');
      return res.json({ success: true, message: 'STATUS column already exists. No changes needed.' });
    }

    console.log('[MIGRATE] ✅ STATUS column added to REQUESTINFO successfully.');
    res.json({ success: true, message: "✅ Migration complete! STATUS column added to REQUESTINFO." });

  } catch (err) {
    console.error('[MIGRATE] ❌ Migration failed:', err.message);
    res.status(500).json({ success: false, error: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

// GET route to fetch all employees for dashboard
app.get('/api/employees', async (req, res) => {
  const userId = Number(req.get('X-User-Id'));
  if (!userId) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  let connection;
  try {
    connection = await oracledb.getConnection(config);
    const currentUser = await getDbUser(connection, userId);

    if (!currentUser || !canReviewRequests(currentUser)) {
      return res.status(403).json({
        success: false,
        error: 'Only CEO, HR, and Manager accounts can view employee dashboard data.'
      });
    }

    const result = await connection.execute(
      `SELECT
        e.EMP_ID,
        e.USERNAME,
        NVL(r.ROLE_NAME, 'N/A') AS ROLE_NAME,
        NVL(TO_CHAR(d.DEPARTMENT_ID), 'N/A') AS DEPARTMENT_ID,
        NVL(b.BRANCH_NAME, 'N/A') AS BRANCH_NAME
      FROM EMPLOYEES e
      LEFT JOIN ROLE r ON e.ROLE_ID = r.ROLE_ID
      LEFT JOIN DEPARTMENT d ON e.DEPARTMENT_ID = d.DEPARTMENT_ID
      LEFT JOIN BRANCH b ON d.BRANCH_ID = b.BRANCH_ID
      ORDER BY e.EMP_ID`
    );

    const employees = result.rows.map((row) => ({
      empId: row[0],
      username: row[1] || '',
      role: row[2] || 'N/A',
      departmentId: row[3] || 'N/A',
      branch: row[4] || 'N/A'
    }));

    res.json({ success: true, employees });
  } catch (err) {
    console.error('Failed to load employee dashboard data:', err.message);
    res.status(500).json({ success: false, error: 'Failed to load employee dashboard data' });
  } finally {
    if (connection) await connection.close();
  }
});

// PUT route — HR/CEO can update an employee's role/position
app.put('/api/employees/:empId/role', async (req, res) => {
  const requesterId = Number(req.get('X-User-Id'));
  const { empId } = req.params;
  const { roleName } = req.body;

  if (!requesterId) return res.status(401).json({ success: false, error: 'Unauthorized' });
  if (!roleName || !roleName.trim()) return res.status(400).json({ success: false, error: 'Role name is required.' });

  const allowed = ['CEO', 'HR'];

  let connection;
  try {
    connection = await oracledb.getConnection(config);
    const requester = await getDbUser(connection, requesterId);

    if (!requester || !allowed.includes(requester.role)) {
      return res.status(403).json({ success: false, error: 'Only CEO and HR can change employee positions.' });
    }

    // Prevent changing CEO's own role by HR
    if (requester.role === 'HR') {
      const targetRes = await connection.execute(
        `SELECT r.ROLE_NAME FROM EMPLOYEES e LEFT JOIN ROLE r ON e.ROLE_ID = r.ROLE_ID WHERE e.EMP_ID = :id`,
        [Number(empId)]
      );
      if (targetRes.rows.length > 0) {
        const targetRole = (targetRes.rows[0][0] || '').toUpperCase();
        if (targetRole === 'CEO') {
          return res.status(403).json({ success: false, error: 'HR cannot change the CEO\'s role.' });
        }
      }
    }

    // Look up or insert the ROLE_ID for the given role name
    let roleIdResult = await connection.execute(
      `SELECT ROLE_ID FROM ROLE WHERE UPPER(ROLE_NAME) = UPPER(:name)`,
      [roleName.trim()]
    );

    let roleId;
    if (roleIdResult.rows.length > 0) {
      roleId = roleIdResult.rows[0][0];
    } else {
      // Insert new role if it doesn't exist
      const maxRoleRes = await connection.execute(`SELECT NVL(MAX(ROLE_ID), 0) + 1 FROM ROLE`);
      roleId = maxRoleRes.rows[0][0];
      await connection.execute(
        `INSERT INTO ROLE (ROLE_ID, ROLE_NAME) VALUES (:1, :2)`,
        [roleId, roleName.trim()],
        { autoCommit: true }
      );
    }

    // Update the employee's ROLE_ID
    const updateRes = await connection.execute(
      `UPDATE EMPLOYEES SET ROLE_ID = :roleId WHERE EMP_ID = :empId`,
      { roleId, empId: Number(empId) },
      { autoCommit: true }
    );

    if (updateRes.rowsAffected === 0) {
      return res.status(404).json({ success: false, error: 'Employee not found.' });
    }

    console.log(`[ROLE UPDATE] EMP #${empId} → "${roleName}" by ${requester.username} (${requester.role})`);
    res.json({ success: true, message: `Position updated to "${roleName}" successfully.` });

  } catch (err) {
    console.error('Failed to update employee role:', err.message);
    res.status(500).json({ success: false, error: 'Failed to update position: ' + err.message });
  } finally {
    if (connection) await connection.close();
  }
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
  (async () => {
    let connection;
    try {
      connection = await oracledb.getConnection(config);
      const added = await ensureStatusColumn(connection);
      if (added) {
        console.log('[STARTUP] ✅ STATUS column added automatically.');
      }
      await ensurePerformanceTables(connection);
    } catch (err) {
      console.error('[STARTUP] Could not auto-check DB columns/tables:', err.message);
    } finally {
      if (connection) await connection.close();
    }
  })();
});

// Helper to ensure performance tables exist
async function ensurePerformanceTables(connection) {
  try {
    // Check if PERFORMANCE_REVIEWS table exists
    const res = await connection.execute(
      `SELECT table_name FROM user_tables WHERE table_name = 'PERFORMANCE_REVIEWS'`
    );
    if (res.rows.length === 0) {
      console.log('[MIGRATE] Creating PERFORMANCE_REVIEWS table...');
      await connection.execute(`
        CREATE TABLE PERFORMANCE_REVIEWS (
          REVIEW_ID NUMBER GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
          EMP_ID NUMBER NOT NULL,
          EMPLOYEE_NAME VARCHAR2(100) NOT NULL,
          DEPARTMENT VARCHAR2(100),
          POSITION VARCHAR2(100),
          SALARY NUMBER(10,2) DEFAULT 0,
          RATING NUMBER(3,1) DEFAULT 3.0,
          STATUS VARCHAR2(30) DEFAULT 'Pending Review',
          REVIEW_PERIOD VARCHAR2(30) DEFAULT '2026 Q2',
          GOALS_ACHIEVED NUMBER DEFAULT 80,
          ATTENDANCE_RATE NUMBER DEFAULT 95,
          REVIEWER VARCHAR2(100) DEFAULT 'HR Manager',
          REVIEW_DATE DATE DEFAULT SYSDATE,
          FEEDBACK VARCHAR2(1000)
        )
      `);
      
      // Seed default sample reviews
      const sampleReviews = [
        [101, 'John Doe', 'Engineering', 'Senior Developer', 4500.00, 4.8, 'Completed', '2026 Q2', 95, 98, 'CEO', 'Outstanding technical leadership and clean delivery.'],
        [102, 'Jane Smith', 'Human Resources', 'HR Specialist', 3800.00, 4.5, 'Completed', '2026 Q2', 90, 96, 'HR Manager', 'Exceptional employee support and recruitment handling.'],
        [103, 'Alex Johnson', 'Marketing', 'Marketing Lead', 4100.00, 3.9, 'Pending Review', '2026 Q2', 82, 91, 'HR Manager', 'Good campaign execution, needs consistent follow-ups.'],
        [104, 'Sarah Williams', 'Finance', 'Financial Analyst', 3900.00, 4.2, 'Completed', '2026 Q2', 88, 94, 'CEO', 'Accurate financial modeling and timely audit reports.'],
        [105, 'Michael Brown', 'Operations', 'Operations Officer', 3200.00, 3.5, 'Under Review', '2026 Q2', 75, 89, 'HR Manager', 'Meeting core KPIs, working on process optimization.']
      ];

      for (const rev of sampleReviews) {
        await connection.execute(
          `INSERT INTO PERFORMANCE_REVIEWS 
           (EMP_ID, EMPLOYEE_NAME, DEPARTMENT, POSITION, SALARY, RATING, STATUS, REVIEW_PERIOD, GOALS_ACHIEVED, ATTENDANCE_RATE, REVIEWER, FEEDBACK)
           VALUES (:1, :2, :3, :4, :5, :6, :7, :8, :9, :10, :11, :12)`,
          rev
        );
      }
      await connection.execute(`COMMIT`);
      console.log('[MIGRATE] ✅ PERFORMANCE_REVIEWS table created & seeded successfully.');
    }
  } catch (err) {
    console.error('[MIGRATE] Error checking/creating PERFORMANCE_REVIEWS table:', err.message);
  }
}

// In-memory fallback mock reviews for demonstration/testing when DB table isn't ready or offline
let mockPerformanceReviews = [
  { reviewId: 1, empId: 101, employeeName: 'John Doe', department: 'Engineering', position: 'Senior Developer', salary: 4500, rating: 4.8, status: 'Completed', reviewPeriod: '2026 Q2', goalsAchieved: 95, attendanceRate: 98, reviewer: 'CEO', feedback: 'Outstanding technical leadership and clean delivery.', reviewDate: '2026-07-15' },
  { reviewId: 2, empId: 102, employeeName: 'Jane Smith', department: 'Human Resources', position: 'HR Specialist', salary: 3800, rating: 4.5, status: 'Completed', reviewPeriod: '2026 Q2', goalsAchieved: 90, attendanceRate: 96, reviewer: 'HR Manager', feedback: 'Exceptional employee support and recruitment handling.', reviewDate: '2026-07-18' },
  { reviewId: 3, empId: 103, employeeName: 'Alex Johnson', department: 'Marketing', position: 'Marketing Lead', salary: 4100, rating: 3.9, status: 'Pending Review', reviewPeriod: '2026 Q2', goalsAchieved: 82, attendanceRate: 91, reviewer: 'HR Manager', feedback: 'Good campaign execution, needs consistent follow-ups.', reviewDate: '2026-07-20' },
  { reviewId: 4, empId: 104, employeeName: 'Sarah Williams', department: 'Finance', position: 'Financial Analyst', salary: 3900, rating: 4.2, status: 'Completed', reviewPeriod: '2026 Q2', goalsAchieved: 88, attendanceRate: 94, reviewer: 'CEO', feedback: 'Accurate financial modeling and timely audit reports.', reviewDate: '2026-07-10' },
  { reviewId: 5, empId: 105, employeeName: 'Michael Brown', department: 'Operations', position: 'Operations Officer', salary: 3200, rating: 3.5, status: 'Under Review', reviewPeriod: '2026 Q2', goalsAchieved: 75, attendanceRate: 89, reviewer: 'HR Manager', feedback: 'Meeting core KPIs, working on process optimization.', reviewDate: '2026-07-21' }
];

// GET route for performance review data
app.get('/api/performance', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(config);
    await ensurePerformanceTables(connection);

    const result = await connection.execute(
      `SELECT REVIEW_ID, EMP_ID, EMPLOYEE_NAME, DEPARTMENT, POSITION, SALARY, RATING, STATUS, REVIEW_PERIOD, GOALS_ACHIEVED, ATTENDANCE_RATE, REVIEWER, TO_CHAR(REVIEW_DATE, 'YYYY-MM-DD'), FEEDBACK
       FROM PERFORMANCE_REVIEWS
       ORDER BY RATING DESC`
    );

    const reviews = result.rows.map(row => ({
      reviewId: row[0],
      empId: row[1],
      employeeName: row[2] || '',
      department: row[3] || 'General',
      position: row[4] || 'Staff',
      salary: Number(row[5]) || 0,
      rating: Number(row[6]) || 0,
      status: row[7] || 'Pending Review',
      reviewPeriod: row[8] || '2026 Q2',
      goalsAchieved: Number(row[9]) || 0,
      attendanceRate: Number(row[10]) || 0,
      reviewer: row[11] || 'HR Manager',
      reviewDate: row[12] || '',
      feedback: row[13] || ''
    }));

    res.json({ success: true, reviews });
  } catch (err) {
    console.error('Failed to load performance DB data (using fallback):', err.message);
    res.json({ success: true, reviews: mockPerformanceReviews, source: 'mock_fallback' });
  } finally {
    if (connection) await connection.close();
  }
});

// POST route to create or update performance review
app.post('/api/performance', async (req, res) => {
  const { empId, employeeName, department, position, salary, rating, status, reviewPeriod, goalsAchieved, attendanceRate, reviewer, feedback } = req.body;

  if (!employeeName || !empId) {
    return res.status(400).json({ success: false, error: 'Employee ID and Name are required.' });
  }

  let connection;
  try {
    connection = await oracledb.getConnection(config);
    await ensurePerformanceTables(connection);

    await connection.execute(
      `INSERT INTO PERFORMANCE_REVIEWS 
       (EMP_ID, EMPLOYEE_NAME, DEPARTMENT, POSITION, SALARY, RATING, STATUS, REVIEW_PERIOD, GOALS_ACHIEVED, ATTENDANCE_RATE, REVIEWER, FEEDBACK)
       VALUES (:1, :2, :3, :4, :5, :6, :7, :8, :9, :10, :11, :12)`,
      [Number(empId), employeeName, department || 'General', position || 'Staff', Number(salary)||0, Number(rating)||3.0, status || 'Pending Review', reviewPeriod || '2026 Q2', Number(goalsAchieved)||80, Number(attendanceRate)||95, reviewer || 'HR Manager', feedback || ''],
      { autoCommit: true }
    );

    res.json({ success: true, message: 'Performance review added successfully!' });
  } catch (err) {
    console.error('Performance insert DB error (saved to mock fallback):', err.message);
    const newRev = {
      reviewId: Date.now(),
      empId: Number(empId),
      employeeName,
      department: department || 'General',
      position: position || 'Staff',
      salary: Number(salary) || 0,
      rating: Number(rating) || 3.0,
      status: status || 'Pending Review',
      reviewPeriod: reviewPeriod || '2026 Q2',
      goalsAchieved: Number(goalsAchieved) || 80,
      attendanceRate: Number(attendanceRate) || 95,
      reviewer: reviewer || 'HR Manager',
      feedback: feedback || '',
      reviewDate: new Date().toISOString().slice(0, 10)
    };
    mockPerformanceReviews.unshift(newRev);
    res.json({ success: true, message: 'Performance review recorded successfully (Fallback Mode)!' });
  } finally {
    if (connection) await connection.close();
  }
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

// GET route to fetch all absence requests for preview
app.get('/api/requests', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(config);
    const requests = await getRequestRows(connection);

    console.log("📤 Sending clean data:", requests);
    res.json(requests);

  } catch (err) {
    console.error("💥 Final error:", err.message);
    res.status(500).json({ error: "Failed to load requests" });
  } finally {
    if (connection) await connection.close();
  }
});
