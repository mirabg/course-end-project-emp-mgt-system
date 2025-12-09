describe("Employee Management System - Complete Test Suite", () => {
  describe("Sign Up", () => {
    beforeEach(() => {
      cy.visit("/signup");
    });

    it("should display sign up page with correct elements", () => {
      cy.contains("h2", "Sign Up").should("be.visible");
      cy.get('input[name="username"]').should("be.visible");
      cy.get('input[name="password"]').should("be.visible");
      cy.contains("button", "Create Account").should("be.visible");
      cy.contains("a", "Login here").should("be.visible");
    });

    it("should successfully create a new account", () => {
      const timestamp = Date.now();
      const testEmail = `newuser${timestamp}@test.com`;

      cy.get('input[name="username"]').type(testEmail);
      cy.get('input[name="password"]').type("testpass123");
      cy.get('button[type="submit"]').click();

      cy.url().should("include", "/login");
    });

    it("should show error when trying to sign up with existing email", () => {
      cy.get('input[name="username"]').type("michael.chen@company.com");
      cy.get('input[name="password"]').type("password123");
      cy.get('button[type="submit"]').click();

      cy.contains("User account has already been created").should("be.visible");
    });
  });

  describe("User Login", () => {
    it("should display user login page with correct elements", () => {
      cy.visit("/login");
      cy.contains("h2", "User Login").should("be.visible");
      cy.get('input[name="username"]').should("be.visible");
      cy.get('input[name="password"]').should("be.visible");
      cy.contains("button", "Login").should("be.visible");
      cy.contains("a", "Sign up here").should("be.visible");
      cy.contains("a", "Admin Login").should("be.visible");
    });

    it("should successfully login as regular user and redirect to directory", () => {
      cy.visit("/login");
      cy.get('input[name="username"]').type("david.kim@company.com");
      cy.get('input[name="password"]').type("password123");
      cy.get('button[type="submit"]').click();

      cy.url().should("include", "/directory");
      cy.contains("Employee Directory").should("be.visible");
    });

    it("should successfully login as admin user and redirect to dashboard", () => {
      cy.visit("/login");
      cy.get('input[name="username"]').type("michael.chen@company.com");
      cy.get('input[name="password"]').type("admin123");
      cy.get('button[type="submit"]').click();

      cy.url().should("include", "/admin/dashboard");
      cy.contains("Welcome, Admin!").should("be.visible");
    });

    it("should show error with invalid credentials", () => {
      cy.visit("/login");
      cy.get('input[name="username"]').type("invalid@example.com");
      cy.get('input[name="password"]').type("wrongpassword");
      cy.get('button[type="submit"]').click();

      cy.contains("Invalid credentials").should("be.visible");
    });

    it("should show error for user with incomplete registration", () => {
      // First create a user with registrationCompleted: false
      const timestamp = Date.now();
      const testEmail = `incomplete${timestamp}@test.com`;

      cy.visit("/signup");
      cy.get('input[name="username"]').type(testEmail);
      cy.get('input[name="password"]').type("testpass123");
      cy.get('button[type="submit"]').click();

      // Try to login
      cy.get('input[name="username"]').type(testEmail);
      cy.get('input[name="password"]').type("testpass123");
      cy.get('button[type="submit"]').click();

      cy.contains("contact a system administrator").should("be.visible");
    });
  });

  describe("Employee Directory", () => {
    beforeEach(() => {
      cy.visit("/login");
      cy.get('input[name="username"]').type("david.kim@company.com");
      cy.get('input[name="password"]').type("password123");
      cy.get('button[type="submit"]').click();
      cy.url().should("include", "/directory");
    });

    it("should display directory page with all elements", () => {
      cy.contains("h1", "Employee Directory").should("be.visible");
      cy.contains("Total Employees:").should("be.visible");
      cy.get("table").should("be.visible");
      cy.contains("Logout").should("be.visible");
    });

    it("should display table with correct columns", () => {
      cy.get("table thead th").should("have.length", 8);
      cy.contains("th", "ID").should("be.visible");
      cy.contains("th", "Name").should("be.visible");
      cy.contains("th", "Designation").should("be.visible");
      cy.contains("th", "Email").should("be.visible");
      cy.contains("th", "Phone").should("be.visible");
      cy.contains("th", "Department").should("be.visible");
      cy.contains("th", "Join Date").should("be.visible");
      cy.contains("th", "Location").should("be.visible");
    });

    it("should display employee data in table rows", () => {
      cy.get("table tbody tr").should("have.length.greaterThan", 0);
      cy.get("table tbody tr")
        .first()
        .within(() => {
          cy.get("td").should("have.length", 8);
        });
    });

    it("should redirect to login when accessing directory without authentication", () => {
      cy.clearCookies();
      cy.visit("/directory");
      cy.url().should("include", "/login");
    });

    it("should logout and redirect to login page", () => {
      cy.contains("Logout").click();
      cy.url().should("include", "/login");
    });
  });

  describe("Admin Dashboard", () => {
    beforeEach(() => {
      cy.visit("/admin/login");
      cy.get('input[name="username"]').type("michael.chen@company.com");
      cy.get('input[name="password"]').type("admin123");
      cy.get('button[type="submit"]').click();
      cy.url().should("include", "/admin/dashboard");
    });

    it("should display dashboard with all elements", () => {
      cy.contains("Welcome, Admin!").should("be.visible");
      cy.contains("Total Employees:").should("be.visible");
      cy.contains("Add Employee").should("be.visible");
      cy.contains("Recent Employees").should("be.visible");
      cy.contains("Directory").should("be.visible");
    });

    it("should navigate to directory from dashboard", () => {
      cy.contains("a", "Directory").click();
      cy.url().should("include", "/directory");
      cy.contains("Employee Directory").should("be.visible");
    });

    it("should display total employee count", () => {
      cy.contains("Total Employees:").should("be.visible");
    });

    it("should display Add Employee button", () => {
      cy.contains("Add Employee").should("be.visible");
    });

    it("should display Recent Employees section", () => {
      cy.contains("Recent Employees").should("be.visible");
    });

    it("should display up to 4 recent employee cards", () => {
      cy.get(".employee-card").should("have.length.at.most", 4);
    });

    it("should display employee details in cards", () => {
      cy.get(".employee-card")
        .first()
        .within(() => {
          cy.contains("Designation:").should("be.visible");
          cy.contains("Email:").should("be.visible");
          cy.contains("Phone:").should("be.visible");
          cy.contains("Department:").should("be.visible");
          cy.contains("Join Date:").should("be.visible");
          cy.contains("Location:").should("be.visible");
        });
    });

    it("should display Delete and Edit buttons on employee cards", () => {
      cy.get(".employee-card")
        .first()
        .within(() => {
          cy.contains("button", "Delete").should("be.visible");
          cy.contains("a", "Edit").should("be.visible");
        });
    });

    it("should redirect to login when accessing admin dashboard without authentication", () => {
      cy.clearCookies();
      cy.visit("/admin/dashboard");
      cy.url().should("include", "/admin/login");
    });
  });

  describe("Admin Login", () => {
    it("should display admin login page", () => {
      cy.visit("/admin/login");
      cy.contains("h2", "Admin Login").should("be.visible");
      cy.contains("a", "User Login").should("be.visible");
    });

    it("should successfully login with admin credentials via admin login", () => {
      cy.visit("/admin/login");
      cy.get('input[name="username"]').type("michael.chen@company.com");
      cy.get('input[name="password"]').type("admin123");
      cy.get('button[type="submit"]').click();
      cy.url().should("include", "/admin/dashboard");
      cy.contains("Welcome, Admin!").should("be.visible");
    });

    it("should show error with invalid admin credentials", () => {
      cy.visit("/admin/login");
      cy.get('input[name="username"]').type("invalid@example.com");
      cy.get('input[name="password"]').type("wrongpassword");
      cy.get('button[type="submit"]').click();
      cy.contains("Invalid credentials").should("be.visible");
    });
  });

  describe("CRUD Operations - Create Employee (Add)", () => {
    beforeEach(() => {
      cy.visit("/admin/login");
      cy.get('input[name="username"]').type("michael.chen@company.com");
      cy.get('input[name="password"]').type("admin123");
      cy.get('button[type="submit"]').click();
    });
    it("should navigate to add employee page", () => {
      cy.contains("Add Employee").click();
      cy.url().should("include", "/admin/add-employee");
      cy.contains("Add New Employee").should("be.visible");
    });

    it("should successfully create a new employee", () => {
      const timestamp = Date.now();
      cy.contains("Add Employee").click();

      // Fill out the form
      cy.get('input[name="name"]').type("John Doe");
      cy.get('select[name="designation"]').select("Software Engineer");
      cy.get('input[name="email"]').type(`john.doe${timestamp}@company.com`);
      cy.get('input[name="phone"]').type("555-9999");
      cy.get('select[name="department"]').select("Engineering");
      cy.get('input[name="joiningDate"]').type("2025-01-01");
      cy.get('input[name="city"]').type("San Francisco");
      cy.get('input[name="state"]').type("CA");

      // Submit the form
      cy.get('button[type="submit"]').click();

      // Should redirect to dashboard
      cy.url().should("include", "/admin/dashboard");
    });

    it("should validate required fields", () => {
      cy.contains("Add Employee").click();
      cy.get('button[type="submit"]').click();

      // HTML5 validation should prevent submission
      cy.url().should("include", "/admin/add-employee");
    });
  });

  describe("CRUD Operations - Read Employee (View)", () => {
    beforeEach(() => {
      cy.visit("/admin/login");
      cy.get('input[name="username"]').type("michael.chen@company.com");
      cy.get('input[name="password"]').type("admin123");
      cy.get('button[type="submit"]').click();
    });

    it("should display employee information on dashboard", () => {
      cy.get(".employee-card").first().should("contain", "Designation:");
      cy.get(".employee-card").first().should("contain", "Email:");
    });

    it("should display employee information in directory", () => {
      cy.visit("/directory");
      cy.get("table tbody tr").should("have.length.greaterThan", 0);
      cy.get("table tbody tr").first().find("td").should("have.length", 8);
    });
  });

  describe("CRUD Operations - Update Employee (Edit)", () => {
    beforeEach(() => {
      cy.visit("/admin/login");
      cy.get('input[name="username"]').type("michael.chen@company.com");
      cy.get('input[name="password"]').type("admin123");
      cy.get('button[type="submit"]').click();
    });
    it("should navigate to edit employee page", () => {
      cy.get(".employee-card")
        .first()
        .within(() => {
          cy.contains("a", "Edit").click();
        });
      cy.url().should("include", "/admin/edit-employee/");
      cy.contains("Edit Employee").should("be.visible");
    });

    it("should pre-populate form with employee data", () => {
      cy.get(".employee-card")
        .first()
        .within(() => {
          cy.contains("a", "Edit").click();
        });

      cy.get('input[name="name"]').should("not.have.value", "");
      cy.get('input[name="email"]').should("not.have.value", "");
    });

    it("should successfully update employee information", () => {
      cy.get(".employee-card")
        .first()
        .within(() => {
          cy.contains("a", "Edit").click();
        });

      // Update the name
      cy.get('input[name="name"]').clear().type("Updated Name");
      cy.get('button[type="submit"]').click();

      // Should redirect to dashboard
      cy.url().should("include", "/admin/dashboard");
    });
  });

  describe("CRUD Operations - Delete Employee", () => {
    beforeEach(() => {
      cy.visit("/admin/login");
      cy.get('input[name="username"]').type("michael.chen@company.com");
      cy.get('input[name="password"]').type("admin123");
      cy.get('button[type="submit"]').click();
    });
    it("should show confirmation dialog when deleting", () => {
      cy.window().then((win) => {
        cy.stub(win, "confirm").returns(false);
      });

      cy.get(".employee-card")
        .first()
        .within(() => {
          cy.contains("button", "Delete").click();
        });
    });

    it("should successfully delete an employee", () => {
      const timestamp = Date.now();
      // First, add a test employee to delete
      cy.contains("Add Employee").click();
      cy.get('input[name="name"]').type("Test Delete User");
      cy.get('select[name="designation"]').select("Software Engineer");
      cy.get('input[name="email"]').type(`test.delete${timestamp}@company.com`);
      cy.get('input[name="phone"]').type("555-0000");
      cy.get('select[name="department"]').select("Engineering");
      cy.get('input[name="joiningDate"]').type("2025-12-31");
      cy.get('input[name="city"]').type("Test City");
      cy.get('input[name="state"]').type("TC");
      cy.get('button[type="submit"]').click();

      // Wait for redirect to dashboard
      cy.url().should("include", "/admin/dashboard");

      // Since the employee should be most recent, delete from the first card
      cy.get(".employee-card")
        .first()
        .within(() => {
          cy.contains("Test Delete User").should("be.visible");
          cy.contains("button", "Delete").click();
        });

      // Accept the confirmation dialog
      cy.on("window:confirm", () => true);
      cy.on("window:alert", (txt) => {
        expect(txt).to.contains("successfully");
      });
    });
  });

  describe("API Routes", () => {
    it("should get all employees via API", () => {
      cy.request("GET", "/api/employees").then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.be.an("array");
        expect(response.body.length).to.be.greaterThan(0);
      });
    });

    it("should get single employee via API", () => {
      cy.request("GET", "/api/employees/1").then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.be.an("object");
        expect(response.body).to.have.property("id", 1);
      });
    });

    it("should create employee via API", () => {
      const newEmployee = {
        name: "API Test User",
        designation: "QA Engineer",
        email: "api.test@company.com",
        password: "password123",
        phone: "555-1111",
        department: "Quality Assurance",
        joiningDate: "2025-02-01",
        location: {
          city: "API City",
          state: "AC",
        },
        isAdmin: false,
        registrationCompleted: true,
      };

      cy.request("POST", "/api/employees", newEmployee).then((response) => {
        expect(response.status).to.eq(201);
        expect(response.body).to.have.property("name", "API Test User");
        expect(response.body).to.have.property("id");
      });
    });

    it("should update employee via API", () => {
      const updatedData = {
        name: "Updated API User",
        designation: "Software Engineer",
        email: "updated.api@company.com",
        password: "password123",
        phone: "555-2222",
        department: "Engineering",
        joiningDate: "2025-03-01",
        location: {
          city: "Updated City",
          state: "UC",
        },
        isAdmin: false,
        registrationCompleted: true,
      };

      cy.request("PUT", "/api/employees/1", updatedData).then((response) => {
        expect(response.status).to.eq(200);
        expect(response.body).to.have.property("name", "Updated API User");
      });
    });

    it("should delete employee via API", () => {
      // First create an employee to delete
      cy.request("POST", "/api/employees", {
        name: "Delete Me",
        designation: "Test",
        email: "delete@test.com",
        password: "password123",
        phone: "555-0000",
        department: "Test",
        joiningDate: "2025-01-01",
        location: { city: "Test", state: "TE" },
        isAdmin: false,
        registrationCompleted: true,
      }).then((createResponse) => {
        const employeeId = createResponse.body.id;

        // Now delete it
        cy.request("DELETE", `/api/employees/${employeeId}`).then(
          (deleteResponse) => {
            expect(deleteResponse.status).to.eq(200);
            expect(deleteResponse.body).to.have.property("success", true);
          }
        );
      });
    });

    it("should return 404 for non-existent employee", () => {
      cy.request({
        method: "GET",
        url: "/api/employees/99999",
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(404);
      });
    });
  });

  describe("Logout Functionality", () => {
    it("should logout from admin dashboard and redirect to login", () => {
      cy.visit("/admin/login");
      cy.get('input[name="username"]').type("michael.chen@company.com");
      cy.get('input[name="password"]').type("admin123");
      cy.get('button[type="submit"]').click();

      cy.contains("Logout").click();
      cy.url().should("include", "/login");

      // Try to access dashboard - should redirect to login
      cy.visit("/admin/dashboard");
      cy.url().should("include", "/admin/login");
    });

    it("should logout from directory and redirect to login", () => {
      cy.visit("/login");
      cy.get('input[name="username"]').type("david.kim@company.com");
      cy.get('input[name="password"]').type("password123");
      cy.get('button[type="submit"]').click();

      cy.contains("Logout").click();
      cy.url().should("include", "/login");

      // Try to access directory - should redirect to login
      cy.visit("/directory");
      cy.url().should("include", "/login");
    });
  });

  describe("Navigation and Routing", () => {
    it("should redirect root to login page", () => {
      cy.visit("/");
      cy.url().should("include", "/login");
    });

    it("should navigate between login pages", () => {
      cy.visit("/login");
      cy.contains("a", "Admin Login").click();
      cy.url().should("include", "/admin/login");

      cy.contains("a", "User Login").click();
      cy.url().should("include", "/login");
    });

    it("should navigate from login to signup", () => {
      cy.visit("/login");
      cy.contains("a", "Sign up here").click();
      cy.url().should("include", "/signup");
    });

    it("should navigate from signup to login", () => {
      cy.visit("/signup");
      cy.contains("a", "Login here").click();
      cy.url().should("include", "/login");
    });
  });
});
