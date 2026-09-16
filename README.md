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

The Oracle connection details, such as the database URL, username, and password, will be configured when the database and JDBC module is implemented. Passwords and other private credentials should not be committed to the repository.

## Java Version

The project targets **Java JDK 17**. Source code should remain compatible with standard Java 17 features and should avoid frameworks or advanced patterns that are not necessary for this college project.

## Frontend

The initial frontend is developed separately from the Java backend and Oracle database. It uses only HTML5, CSS3, Bootstrap 5, and basic JavaScript. No Java, JDBC, Oracle, React, Angular, Vue, Node.js, npm, jQuery, or other frontend framework is used at this stage.

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
- `login.html` and `register.html` provide basic client-side user forms.
- `user-dashboard.html` links users to searching, booking, tickets, and travel history.
- `route-search.html` displays sample routes and booking links.
- `booking.html` displays a selected route and calculates the simulated total fare.
- `ticket.html` displays a sample ticket and QR placeholder.
- `invoice.html` displays a sample invoice with print support.
- `travel-history.html` displays sample previous bookings.
- `admin-login.html` provides the frontend-only administrator login form.
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

Backend integration, real authentication, database access, QR generation, payments, and persistent route or booking changes will be implemented in a later step. This frontend prompt intentionally stops before that integration.

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

`DatabaseOperationsTest` is a small executable test for finding a sample user and admin, loading routes, and searching for a route. It uses the sample data from the database scripts and does not implement login, booking workflow, QR generation, or frontend integration.
