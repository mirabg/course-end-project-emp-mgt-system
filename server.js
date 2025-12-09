const express = require("express");
const fs = require("fs");
const path = require("path");
const cookieParser = require("cookie-parser");

const app = express();
const PORT = 3000;
const DB_FILE = path.join(__dirname, "db.json");

// Middleware
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Helper functions for reading and writing to db.json
const readDatabase = () => {
  try {
    const data = fs.readFileSync(DB_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading database:", error);
    return { employees: [] };
  }
};

const writeDatabase = (data) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error("Error writing to database:", error);
    return false;
  }
};

// Authentication middleware
const isAuthenticated = (req, res, next) => {
  if (req.cookies.isAdmin === "true") {
    next();
  } else {
    res.redirect("/admin/login");
  }
};

// User authentication middleware
const isUserAuthenticated = (req, res, next) => {
  if (req.cookies.isUser === "true" || req.cookies.isAdmin === "true") {
    next();
  } else {
    res.redirect("/login");
  }
};

// Routes

// Sign up page
app.get("/signup", (req, res) => {
  res.render("signup", { error: null });
});

// Sign up POST
app.post("/signup", (req, res) => {
  const { username, password } = req.body;
  const db = readDatabase();

  // Check if user already exists
  const existingUser = db.employees.find((emp) => emp.email === username);

  if (existingUser) {
    return res.render("signup", {
      error: "User account has already been created",
    });
  }

  // Generate new ID
  const newId =
    db.employees.length > 0
      ? Math.max(...db.employees.map((e) => e.id)) + 1
      : 1;

  // Create new user account
  const newUser = {
    id: newId,
    name: "",
    designation: "",
    email: username,
    password: password,
    phone: "",
    department: "",
    joiningDate: new Date().toISOString().split("T")[0],
    location: {
      city: "",
      state: "",
    },
    isAdmin: false,
    registrationCompleted: false,
  };

  db.employees.push(newUser);

  if (writeDatabase(db)) {
    res.redirect("/login");
  } else {
    res.render("signup", { error: "Failed to create account" });
  }
});

// User login page
app.get("/login", (req, res) => {
  res.render("login", { error: null });
});

// User login POST
app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const db = readDatabase();

  // Find user by email
  const user = db.employees.find((emp) => emp.email === username);

  // Check password
  if (user && user.password === password) {
    // Check if registration is completed
    if (!user.registrationCompleted) {
      return res.render("login", {
        error:
          "Please contact a system administrator to finish the signup process",
      });
    }

    // Set cookies based on user type
    if (user.isAdmin) {
      res.cookie("isAdmin", "true", { maxAge: 3600000 }); // 1 hour
      res.cookie("adminName", user.name, { maxAge: 3600000 });
      res.redirect("/admin/dashboard");
    } else {
      res.cookie("isUser", "true", { maxAge: 3600000 }); // 1 hour
      res.cookie("userName", user.name, { maxAge: 3600000 });
      res.cookie("userId", user.id.toString(), { maxAge: 3600000 });
      res.redirect("/directory");
    }
  } else {
    res.render("login", {
      error: "Invalid credentials",
    });
  }
});

// Admin login page
app.get("/admin/login", (req, res) => {
  res.render("admin/login", { error: null });
});

// Admin login POST
app.post("/admin/login", (req, res) => {
  const { username, password } = req.body;
  const db = readDatabase();

  // Find admin user
  const admin = db.employees.find(
    (emp) => emp.email === username && emp.isAdmin === true
  );

  // Check password from database
  if (admin && admin.password === password) {
    res.cookie("isAdmin", "true", { maxAge: 3600000 }); // 1 hour
    res.cookie("adminName", admin.name, { maxAge: 3600000 });
    res.redirect("/admin/dashboard");
  } else {
    res.render("admin/login", {
      error: "Invalid credentials or not an admin user",
    });
  }
});

// Admin logout
app.get("/admin/logout", (req, res) => {
  res.clearCookie("isAdmin");
  res.clearCookie("adminName");
  res.redirect("/admin/login");
});

// Admin dashboard
app.get("/admin/dashboard", isAuthenticated, (req, res) => {
  const db = readDatabase();
  const employees = db.employees;

  // Get 4 most recent employees sorted by joining date
  const recentEmployees = [...employees]
    .sort((a, b) => new Date(b.joiningDate) - new Date(a.joiningDate))
    .slice(0, 4);

  res.render("admin/dashboard", {
    totalEmployees: employees.length,
    recentEmployees,
    adminName: req.cookies.adminName,
  });
});

// Add employee page
app.get("/admin/add-employee", isAuthenticated, (req, res) => {
  res.render("admin/add-employee", { error: null });
});

// Add employee POST
app.post("/admin/add-employee", isAuthenticated, (req, res) => {
  const db = readDatabase();

  // Generate new ID
  const newId =
    db.employees.length > 0
      ? Math.max(...db.employees.map((e) => e.id)) + 1
      : 1;

  const newEmployee = {
    id: newId,
    name: req.body.name,
    designation: req.body.designation,
    email: req.body.email,
    password: req.body.password || "password123",
    phone: req.body.phone,
    department: req.body.department,
    joiningDate: req.body.joiningDate,
    location: {
      city: req.body.city,
      state: req.body.state,
    },
    isAdmin: req.body.isAdmin === "true",
    registrationCompleted: true,
  };

  db.employees.push(newEmployee);

  if (writeDatabase(db)) {
    res.redirect("/admin/dashboard");
  } else {
    res.render("admin/add-employee", { error: "Failed to add employee" });
  }
});

// Edit employee page
app.get("/admin/edit-employee/:id", isAuthenticated, (req, res) => {
  const db = readDatabase();
  const employee = db.employees.find((e) => e.id === parseInt(req.params.id));

  if (employee) {
    res.render("admin/edit-employee", { employee, error: null });
  } else {
    res.redirect("/admin/dashboard");
  }
});

// Edit employee POST
app.post("/admin/edit-employee/:id", isAuthenticated, (req, res) => {
  const db = readDatabase();
  const employeeIndex = db.employees.findIndex(
    (e) => e.id === parseInt(req.params.id)
  );

  if (employeeIndex !== -1) {
    const currentEmployee = db.employees[employeeIndex];
    db.employees[employeeIndex] = {
      id: parseInt(req.params.id),
      name: req.body.name,
      designation: req.body.designation,
      email: req.body.email,
      password: req.body.password || currentEmployee.password || "password123",
      phone: req.body.phone,
      department: req.body.department,
      joiningDate: req.body.joiningDate,
      location: {
        city: req.body.city,
        state: req.body.state,
      },
      isAdmin: req.body.isAdmin === "true",
      registrationCompleted:
        currentEmployee.registrationCompleted !== undefined
          ? currentEmployee.registrationCompleted
          : true,
    };

    if (writeDatabase(db)) {
      res.redirect("/admin/dashboard");
    } else {
      res.render("admin/edit-employee", {
        employee: db.employees[employeeIndex],
        error: "Failed to update employee",
      });
    }
  } else {
    res.redirect("/admin/dashboard");
  }
});

// Delete employee
app.post("/admin/delete-employee/:id", isAuthenticated, (req, res) => {
  const db = readDatabase();
  db.employees = db.employees.filter((e) => e.id !== parseInt(req.params.id));

  if (writeDatabase(db)) {
    res.json({ success: true });
  } else {
    res
      .status(500)
      .json({ success: false, error: "Failed to delete employee" });
  }
});

// API Routes for CRUD operations

// Get all employees
app.get("/api/employees", (req, res) => {
  const db = readDatabase();
  res.json(db.employees);
});

// Get single employee
app.get("/api/employees/:id", (req, res) => {
  const db = readDatabase();
  const employee = db.employees.find((e) => e.id === parseInt(req.params.id));

  if (employee) {
    res.json(employee);
  } else {
    res.status(404).json({ error: "Employee not found" });
  }
});

// Create employee
app.post("/api/employees", (req, res) => {
  const db = readDatabase();

  const newId =
    db.employees.length > 0
      ? Math.max(...db.employees.map((e) => e.id)) + 1
      : 1;

  const newEmployee = {
    id: newId,
    ...req.body,
  };

  db.employees.push(newEmployee);

  if (writeDatabase(db)) {
    res.status(201).json(newEmployee);
  } else {
    res.status(500).json({ error: "Failed to create employee" });
  }
});

// Update employee
app.put("/api/employees/:id", (req, res) => {
  const db = readDatabase();
  const employeeIndex = db.employees.findIndex(
    (e) => e.id === parseInt(req.params.id)
  );

  if (employeeIndex !== -1) {
    db.employees[employeeIndex] = {
      id: parseInt(req.params.id),
      ...req.body,
    };

    if (writeDatabase(db)) {
      res.json(db.employees[employeeIndex]);
    } else {
      res.status(500).json({ error: "Failed to update employee" });
    }
  } else {
    res.status(404).json({ error: "Employee not found" });
  }
});

// Delete employee
app.delete("/api/employees/:id", (req, res) => {
  const db = readDatabase();
  const initialLength = db.employees.length;
  db.employees = db.employees.filter((e) => e.id !== parseInt(req.params.id));

  if (db.employees.length < initialLength) {
    if (writeDatabase(db)) {
      res.json({ success: true, message: "Employee deleted" });
    } else {
      res.status(500).json({ error: "Failed to delete employee" });
    }
  } else {
    res.status(404).json({ error: "Employee not found" });
  }
});

// Directory route for non-admin users
app.get("/directory", isUserAuthenticated, (req, res) => {
  const db = readDatabase();
  const employees = db.employees;

  res.render("directory", {
    employees,
    userName: req.cookies.userName || req.cookies.adminName || "User",
  });
});

// Logout route for all users
app.get("/logout", (req, res) => {
  res.clearCookie("isAdmin");
  res.clearCookie("adminName");
  res.clearCookie("isUser");
  res.clearCookie("userName");
  res.clearCookie("userId");
  res.redirect("/login");
});

// Root redirect
app.get("/", (req, res) => {
  res.redirect("/login");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = app;
