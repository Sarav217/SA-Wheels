# Public Transport Bus Ticketing System

## Project Purpose

The Public Transport Bus Ticketing System is a simple Java console application for managing bus routes, calculating fares, booking tickets, generating QR ticket references, creating invoices, and maintaining travel history.

This project is designed as a college project. The implementation will use basic object-oriented programming, JDBC, SQL, and a clear module structure that is easy to understand and explain during a viva.

## Technology Stack

- Java JDK 17
- Oracle Database 21c XE
- JDBC for database connectivity
- SQL*Plus for creating and managing database objects
- VS Code or Eclipse for development
- No Spring, Hibernate, or unnecessary frameworks
- Java console application as the initial user interface

## Project Modules

The application is planned to contain the following modules:

1. Database and JDBC connectivity
2. User authentication
3. Bus route management
4. Fare calculation
5. Ticket booking
6. QR ticket generation
7. Invoice generation and travel history
8. Admin functions and reports

Only the initial project structure has been created at this stage. The modules will be implemented incrementally.

## Project Folder Structure

```text
PublicTransportTicketingSystem/
├── README.md
├── database/
├── lib/
└── src/
    └── com/
        └── busticket/
            ├── Main.java
            ├── model/
            ├── dao/
            ├── service/
            └── util/
```

- `database/` will contain Oracle SQL scripts for tables, sequences, sample data, and reports.
- `lib/` will contain external library files required by the project, such as the Oracle JDBC driver if it is not supplied through the development environment.
- `src/com/busticket/` contains the Java source code.
- `model/` will contain simple Java classes representing project data.
- `dao/` will contain JDBC-based database access classes.
- `service/` will contain application and business logic.
- `util/` will contain reusable helper classes, such as database connection utilities.
- `Main.java` will be the starting point for the console application.

## Planned Database

The actual implementation database is **Oracle Database 21c XE**. Although some original project documentation refers to MySQL, Oracle is the required database environment for this implementation.

Database access will be implemented using standard JDBC and the Oracle JDBC driver. SQL scripts will be executed using SQL*Plus during database setup and testing.

The planned database stores users, admin accounts, routes, bookings, tickets, and invoices. The table design is defined in the SQL scripts under `database/`.

## Database Setup

The database scripts are designed for Oracle Database 21c XE and SQL*Plus. Connect to the intended Oracle schema, then run the scripts in this order:

```sql
@database/01_create_tables.sql
@database/02_insert_sample_data.sql
@database/03_test_queries.sql
```

The first script creates the tables and constraints. The second script inserts development-only sample users, one admin account, and eight routes. The third script runs read-only queries for checking the data and relationships.

From a command prompt, the same process can be started with SQL*Plus using a connection string appropriate for the local Oracle XE installation:

```text
sqlplus username/password@localhost:1521/XEPDB1
```

The connection service name may differ depending on the Oracle XE configuration. Do not store real passwords in this repository.

### Database Tables and Relationships

- `USERS` stores passenger and admin-linked user accounts. Email addresses are unique.
- `ADMIN` stores administrator privileges and references one record in `USERS`.
- `ROUTES` stores route numbers, source and destination locations, schedules, and fares.
- `BOOKINGS` references one user and one route. A route, travel date, and seat number combination is unique.
- `TICKETS` references one booking. Its unique booking constraint provides the one-to-one booking-to-ticket relationship.
- `INVOICES` references one booking. Its unique booking constraint provides the one-to-one booking-to-invoice relationship.

The main relationships are:

```text
USERS   1 ---- * BOOKINGS * ---- 1 ROUTES
                  |
                  +---- 1 TICKETS
                  +---- 1 INVOICES

USERS   1 ---- 0..1 ADMIN
```

### Sample Credentials

The sample script inserts these local-development credentials:

| Account | Email | Password | Role |
|---|---|---|---|
| Arun Kumar | `arun.kumar@example.com` | `Arun@123` | User |
| Priya Sharma | `priya.sharma@example.com` | `Priya@123` | User |
| System Administrator | `admin@busticket.com` | `Admin@123` | Admin |

These are demonstration values only. Password hashing and secure credential handling will be considered when authentication is implemented.

## Development Plan

The project will be developed in the following order:

1. Set up the Oracle database and JDBC connection.
2. Create the database tables and supporting SQL scripts.
3. Add model classes for the main entities.
4. Implement authentication.
5. Implement route management and fare calculation.
6. Implement ticket booking and QR ticket generation.
7. Implement invoices and travel history.
8. Implement admin functions and reports.
9. Test each module through the Java console application.

Each module will use simple classes and methods with readable names. Database operations will be kept in DAO classes, while application rules will be handled in service classes.

## Oracle and JDBC Requirement

To run the completed application, Oracle Database 21c XE must be installed and running. The project will also require a compatible Oracle JDBC driver, commonly provided as an `ojdbc` JAR file. The driver JAR may be placed in the `lib/` folder and included in the Java classpath when compiling and running the application.

The Oracle connection uses the optional `DB_URL` setting plus the required `DB_USERNAME` and `DB_PASSWORD` environment variables (or Java system properties). The URL defaults to `jdbc:oracle:thin:@localhost:1521/XEPDB1`. Passwords and other private credentials must not be committed to the repository.

## Java Version

The project targets **Java JDK 17**. Source code should remain compatible with standard Java 17 features and should avoid frameworks or advanced patterns that are not necessary for this college project.

## Frontend

The frontend uses HTML5, CSS3, Bootstrap 5, and basic JavaScript. Most pages still use sample data, while the registration, user login, admin login, and logout forms now connect to the Java Servlet module when deployed on Tomcat. No React, Angular, Vue, Node.js, npm, jQuery, or other frontend framework is used.

### Frontend Folder Structure

```text
frontend/
├── index.html
├── login.html
├── register.html
├── user-dashboard.html
├── route-search.html
├── booking.html
├── ticket.html
├── invoice.html
├── travel-history.html
├── admin-login.html
├── admin-dashboard.html
├── route-management.html
├── css/
│   └── style.css
└── js/
    └── script.js
```

### Frontend Pages

- `index.html` provides the public home page and sample route search form.
- `login.html` and `register.html` submit user authentication forms to Java Servlets.
- `user-dashboard.html` links users to searching, booking, tickets, and travel history.
- `route-search.html` displays sample routes and booking links.
- `booking.html` displays a selected route and calculates the simulated total fare.
- `ticket.html` displays a sample ticket and QR placeholder.
- `invoice.html` displays a sample invoice with print support.
- `travel-history.html` displays sample previous bookings.
- `admin-login.html` submits the administrator login form to a Java Servlet.
- `admin-dashboard.html` displays sample statistics and administrator navigation.
- `route-management.html` provides a visual add-route form and sample route table.
- `css/style.css` contains shared custom styling that complements Bootstrap.
- `js/script.js` contains validation, password confirmation, fare calculation, print handling, and simple static form feedback.

Bootstrap 5.3.3 is loaded from the jsDelivr CDN on each page. The current pages use clearly labelled sample data; they do not pretend to read data from Oracle.

### Current and Future Architecture

Current frontend architecture:

```text
HTML
CSS
Bootstrap
JavaScript
```

Planned architecture after backend integration:

```text
HTML/CSS/Bootstrap/JavaScript
            ↓
       Java Backend
            ↓
           JDBC
            ↓
       Oracle 21c XE
```

QR generation, payments, and persistent route or booking changes will be implemented in later modules. Authentication integration is now limited to the Module 5 forms and sessions.

## Java Model Classes and Basic Database Operations

Module 4 adds simple Java model classes under `src/com/busticket/model/`. `User`, `Admin`, `Route`, `Booking`, `Ticket`, and `Invoice` represent the matching Oracle tables. Their private fields, constructors, getters, setters, and readable `toString()` methods demonstrate basic encapsulation.

The single `DatabaseOperations` class contains the first JDBC operations for users, admins, routes, bookings, tickets, and invoices. It uses `PreparedStatement`, `ResultSet`, try-with-resources, and the existing `DBConnection` class. Separate DAO and service layers have intentionally not been added.

The basic Java architecture is:

```text
Java Model Classes
        ↓
DatabaseOperations
        ↓
DBConnection
        ↓
JDBC
        ↓
Oracle 21c XE
```

## Module 5: Registration, Login, and Authentication

Module 5 adds simple Servlet-based authentication for Apache Tomcat 10.1 or later. The Servlet API is provided by Tomcat and uses the `jakarta.servlet` package.

### Authentication Servlets

- `RegisterServlet` validates the registration form, checks for an existing email, and calls `DatabaseOperations.addUser()`.
- `LoginServlet` checks a user's email and password, then stores the user ID and name in an HTTP session.
- `AdminLoginServlet` checks the linked admin record and the related user's password. Because the existing `ADMIN` table has no username column, the linked user email is used as the admin username.
- `LogoutServlet` invalidates the current session and redirects to the home page.
- `AuthFilter` protects user and admin HTML pages from unauthenticated access.

Servlet mappings are defined in `frontend/WEB-INF/web.xml`:

```text
/register       -> RegisterServlet
/login          -> LoginServlet
/admin-login    -> AdminLoginServlet
/logout         -> LogoutServlet
```

### Authentication Flow

```text
User
 ↓
HTML Form
 ↓
Servlet
 ↓
DatabaseOperations
 ↓
JDBC
 ↓
Oracle 21c XE
```

### Testing Authentication

1. Deploy the `frontend/` directory as a Tomcat web application and place the compiled Servlet classes under `WEB-INF/classes`.
2. Make the Oracle JDBC driver available to the web application or Tomcat `lib` directory.
3. Configure the connection before starting Tomcat. In PowerShell, for example:

```powershell
$env:DB_URL = "jdbc:oracle:thin:@localhost:1521/XEPDB1"
$env:DB_USERNAME = "SYSTEM"
$env:DB_PASSWORD = "your-local-password"
```

   Ensure the `USERS` and `ADMIN` tables and sample data exist in the same schema and service.
4. Open `/register.html` to test registration.
5. Open `/login.html` to test user login and `/admin-login.html` to test admin login.
6. Verify that protected pages redirect to the appropriate login page without a session.
7. Use the Logout link and verify that the session is invalidated.

The authentication source requires the Jakarta Servlet API supplied by Tomcat 10.1+. Tomcat and its Servlet API were not installed in this workspace, so deployment testing requires a local Tomcat installation. Passwords are used only for this simple college-project flow and are not printed in messages or logs.

## Module 6: Route Management, Route Search, and Fare Calculation

Module 6 continues the existing architecture without adding DAO or Service classes:

```text
Frontend JavaScript
        ↓
Route Servlet
        ↓
DatabaseOperations.java
        ↓
Oracle JDBC connection
        ↓
Oracle 21c XE
```

### Route Features

- `RouteManagementServlet` provides admin-only add, edit, delete, and list operations.
- `RouteSearchServlet` provides logged-in user route searches by source and destination.
- `DatabaseOperations` now contains `addRoute`, `updateRoute`, `deleteRoute`, and `getRouteById` methods.
- `frontend/route-management.html` loads routes and sends admin CRUD requests.
- `frontend/route-search.html` loads current route data and provides booking links with the selected route ID.
- Route management and route search endpoints are protected by the existing `AuthFilter`.

### Fare Calculation

The booking page loads the selected route's base fare and calculates:

```text
Total fare = base fare × number of passengers
```

Passenger counts must be between 1 and 6. The fare is calculated in the browser for this module; ticket creation and persistent booking will be implemented later.

### Route Schema Note

The existing Oracle `ROUTES` table contains route number, source, destination, departure time, arrival time, fare, and status. It does not contain a stops column. Therefore, Module 6 displays `Not configured` for stops and calculates travel time from the departure and arrival values. The database schema was not changed.

Route times entered by the admin use `HH:mm` and are stored as Oracle `DATE` values using a common schedule date. Arrival must be later than departure for the current schema constraint.

## Module 7: Ticket Booking, QR Code, Invoice, and Travel History

Module 7 adds the logged-in user booking flow using the existing `DatabaseOperations.java` architecture. No DAO, Service, or additional database connection class was created.

### Module 7 Components

- `BookingServlet` validates the selected route, travel date, payment method, and passenger count, calculates the total fare, and creates the booking, ticket, and invoice in one database transaction.
- `TravelHistoryServlet` returns bookings belonging only to the current user.
- `TicketServlet` returns ticket details after checking that the booking belongs to the current user.
- `InvoiceServlet` returns invoice details for the current user's booking.
- `QrCodeServlet` streams the ticket QR image after checking the user session and booking ownership.
- `QrCodeGenerator` uses ZXing to generate a PNG QR image from the stored ticket payload.

The new Servlet mappings are:

```text
/booking        -> BookingServlet
/travel-history -> TravelHistoryServlet
/ticket         -> TicketServlet
/invoice        -> InvoiceServlet
/ticket-qr      -> QrCodeServlet
```

### Booking Flow

```text
Logged-in user selects route
            ↓
Booking form submits route, date, passengers, and payment method
            ↓
BookingServlet validates and calculates total fare
            ↓
DatabaseOperations creates BOOKING, TICKET, and INVOICE transactionally
            ↓
User is redirected to the generated ticket and QR image
```

The total fare is calculated as:

```text
base fare × number of passengers
```

Passenger count is limited to 1 through 6. The QR payload contains the final booking ID, user ID, route ID, source, destination, passenger count, and fare. A unique ticket number and QR payload are generated for each booking.

### Database Migration

The existing `BOOKINGS` table did not have a passenger-count column, so the required schema change is isolated in:

```sql
@database/04_module7_booking_passenger_count.sql
```

Run this migration once on an existing Module 1–6 Oracle schema. New database setups should use the updated `01_create_tables.sql`. The migration also increases `TICKETS.QR_CODE` to hold the complete ticket payload.

The `ROUTES` table still supplies source and destination details; those values are copied into the QR payload and history response through the route relationship. No duplicate source or destination columns were added to `BOOKINGS`.

ZXing dependencies used by the QR generator are stored in `lib/core-3.5.3.jar` and `lib/javase-3.5.3.jar`. They must be available to the Java compiler and Tomcat web application along with `ojdbc11.jar`.

`DatabaseOperationsTest` is a small executable test for finding a sample user and admin, loading routes, and searching for a route. It uses the sample data from the database scripts and does not implement login, booking workflow, QR generation, or frontend integration.
