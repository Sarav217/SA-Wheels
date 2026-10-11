# SA Wheels

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

## Quick Start in VS Code

After installing JDK 17, Tomcat 10.1 and Oracle 21c XE and running the database scripts once:

1. Open the project folder in VS Code (install the **Extension Pack for Java**).
2. Press **Ctrl+Shift+B** (or run `.\run.ps1` in the terminal).
3. Enter the Oracle password when asked, then open `http://localhost:8080/PublicTransportTicketingSystem/`.
4. The welcome popup offers **User Login**, **Admin Login** and **Register**. Use the demo accounts below.

| Login | Username / Email | Password |
|---|---|---|
| User | `arun.kumar@example.com` | `Arun@123` |
| Admin | `admin` | `Admin@123` |

The admin password is stored only as a PBKDF2 hash in the `ADMIN` table (see [Admin Login and Admin Console](#admin-login-and-admin-console)). Run `database/06_admin_credentials.sql` once before the first admin login.

`run.ps1` copies the frontend and JARs into Tomcat, compiles the Java sources and starts Tomcat. It uses `D:\apache-tomcat-10.1.60` unless `CATALINA_HOME` is set; change that path in `run.ps1` and `.vscode/settings.json` if Tomcat is installed elsewhere. Press Ctrl+C to stop Tomcat.

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
@database/05_connecting_routes.sql
@database/06_admin_credentials.sql
@database/07_ticket_expiry.sql
```

Run `04_module7_booking_passenger_count.sql` only when upgrading a pre-Module 7 schema. The first script creates the tables and constraints. The second script inserts development-only sample users, one admin account, and eight routes. The third script runs read-only queries for checking the data and relationships. The fifth script adds six connecting sample routes (R601–R606) so that route search can show journeys with changes, such as Chennai Central → Tambaram → Guindy → Adyar. It is safe to run more than once. The sixth script adds the admin `USERNAME` and `PASSWORD_HASH` columns and sets up the demo admin login; it is also safe to run more than once. The seventh script adds the `TICKETS.DEMO_ACTIVE` flag used for ticket expiry (see [Ticket Expiry and Demo Tickets](#ticket-expiry-and-demo-tickets)); it is safe to run more than once.

### Connecting routes and "Use my location"

Route search shows direct routes from `RouteSearchServlet` and, below them, connecting journeys with up to two changes. The browser builds these from the list of active routes: a route connects to the next one when it ends where the next one starts. A connection counts as timed when the next bus leaves at least 5 minutes after the previous one arrives. Imported MTC routes only have placeholder `00:00`–`01:00` times, so connections that use them are marked "check timetable".

"Use my location" under the Source field uses the browser Geolocation API. It picks the nearest stop from a table of approximate Chennai stop coordinates in `frontend/js/script.js` (`STOP_COORDINATES`), but only if that stop is within 30 km. Browsers allow geolocation only on `https` or `localhost` pages.

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

The admin account signs in on the separate Admin Login form with username `admin` and password `Admin@123`. That password is not stored in plain text: `06_admin_credentials.sql` stores a PBKDF2 hash in `ADMIN.PASSWORD_HASH`, and the linked `admin@busticket.com` user row has an unusable placeholder password, so the admin account cannot be used through the user login.

These are demonstration values only.

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

- `index.html` provides the public SA Wheels home page and database-backed route search without booking actions.
- `login.html` and `register.html` submit user authentication forms to Java Servlets.
- `user-dashboard.html` links users to searching, booking, tickets, and travel history.
- `route-search.html` loads current routes and provides booking links for logged-in users.
- `booking.html` displays a selected route and calculates the simulated total fare.
- `ticket.html` displays a sample ticket and QR placeholder.
- `invoice.html` displays a sample invoice with print support.
- `travel-history.html` displays sample previous bookings.
- `admin-login.html` submits the administrator login form to a Java Servlet.
- `admin-dashboard.html` displays sample statistics and administrator navigation.
- `route-management.html` provides a visual add-route form and sample route table.
- `css/style.css` contains shared custom styling that complements Bootstrap.
- `js/script.js` contains validation, password confirmation, fare calculation, route loading, print handling, branding, and search interactions.
- `assets/sa-logo.svg` is the reusable SA Wheels logo shown in the navigation bars.

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
- `AdminLoginServlet` looks up the admin by `ADMIN.USERNAME` and verifies the password against the PBKDF2 hash in `ADMIN.PASSWORD_HASH`. It is separate from user login (see [Admin Login and Admin Console](#admin-login-and-admin-console)).
- `LogoutServlet` invalidates the current session and redirects to the home page.
- `AuthFilter` protects user and admin HTML pages from unauthenticated access.

Servlet mappings are defined in `frontend/WEB-INF/web.xml`:

```text
/register       -> RegisterServlet
/login          -> LoginServlet
/admin-login    -> AdminLoginServlet
/admin-data     -> AdminDataServlet
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

The authentication source requires the Jakarta Servlet API supplied by Tomcat 10.1+. Passwords are used only for this simple college-project flow and are not printed in messages or logs.

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

### Ticket Expiry and Demo Tickets

Each ticket is valid for **6 hours** from `TICKETS.ISSUED_AT` (`Ticket.VALIDITY_HOURS`). Expiry is calculated in SQL against the database clock (`ISSUED_AT + 6 hours` compared with `SYSDATE`) every time a ticket is read, so no scheduled job is needed.

- The ticket page shows the issue time, the valid-until time, and a live countdown. The countdown turns amber in the last 15 minutes.
- When a ticket expires, or its booking is cancelled, `QrCodeServlet` returns a **blurred QR image** generated on the server that cannot be scanned. The page also greys the code out and stamps it "Expired". Because the blur is applied on the server, the readable QR cannot be recovered from the browser.
- Travel History shows a Ticket column with Active, Expired, or Cancelled.

`database/07_ticket_expiry.sql` adds `TICKETS.DEMO_ACTIVE` (`'Y'`/`'N'`, default `'N'`). A ticket with `DEMO_ACTIVE = 'Y'` never expires; it is shown as "Active · Demo" with a readable QR code. The script marks the two most recent confirmed tickets of `arun.kumar@example.com` as demo tickets, so logging in as that user shows both active and expired tickets.

To mark or unmark a ticket for a demo:

```sql
UPDATE tickets SET demo_active = 'Y' WHERE ticket_number = 'TKT-...';  -- always active
UPDATE tickets SET demo_active = 'N' WHERE ticket_number = 'TKT-...';  -- normal 6-hour expiry
COMMIT;
```

## Module 9: Complete Frontend, Servlet, and Oracle Integration

The current integration keeps the existing project architecture:

```text
HTML + Bootstrap + JavaScript
              ↓
        Java Servlets
              ↓
     DatabaseOperations.java
              ↓
       DBConnection.java
              ↓
          Oracle 21c XE
```

No DAO classes, Service classes, duplicate connection classes, or SQL inside HTML pages were added.

### Deployment Structure

Deploy the `frontend/` directory as the Tomcat web application root. It already contains `WEB-INF/web.xml`. Compile all Java sources into `frontend/WEB-INF/classes` and make these JAR files available in `frontend/WEB-INF/lib` or Tomcat's `lib` directory:

```text
lib/ojdbc11.jar
lib/core-3.5.3.jar
lib/javase-3.5.3.jar
```

The application targets Apache Tomcat 10.1+ and Jakarta Servlet 6.0.

### Manual Tomcat Build and Run

From PowerShell, after setting `CATALINA_HOME` to the Tomcat installation directory:

```powershell
$env:DB_URL = "jdbc:oracle:thin:@localhost:1521/XEPDB1"
$env:DB_USERNAME = "SYSTEM"
$env:DB_PASSWORD = "your-local-password"

New-Item -ItemType Directory -Force frontend/WEB-INF/classes | Out-Null
New-Item -ItemType Directory -Force frontend/WEB-INF/lib | Out-Null
Copy-Item lib/*.jar frontend/WEB-INF/lib/ -Force

$servletApi = "$env:CATALINA_HOME/lib/servlet-api.jar"
$classpath = "lib/ojdbc11.jar;lib/core-3.5.3.jar;lib/javase-3.5.3.jar;$servletApi"
$sources = Get-ChildItem src -Recurse -Filter *.java | Select-Object -ExpandProperty FullName
& "C:/Program Files/Java/jdk-17/bin/javac.exe" -cp $classpath -d frontend/WEB-INF/classes $sources

& "$env:CATALINA_HOME/bin/startup.bat"
```

Open the deployed context, then test `/register.html`, `/login.html`, `/route-search.html`, `/booking.html`, `/travel-history.html`, and `/admin-login.html`.

Before testing booking, run the database scripts in order. Apply the Module 7 migration only when upgrading an older schema that does not already contain `PASSENGER_COUNT`:

```sql
@database/01_create_tables.sql
@database/02_insert_sample_data.sql
-- For an older pre-Module 7 schema only:
@database/04_module7_booking_passenger_count.sql
```

The migration is only needed when the tables already exist from before Module 7. Do not run the base table script repeatedly on an existing schema.

### Integration Status

Tomcat 10.1.60 was installed locally and the application was deployed and tested at `http://localhost:8080/PublicTransportTicketingSystem/`. The source code, Servlet mappings, frontend form targets, session filters, JDK 17 compilation, Oracle connection, user flow, booking flow, QR generation, invoice/history endpoints, and admin route CRUD were verified. Database credentials are supplied through local environment variables and must not be committed.

`DatabaseOperationsTest` is a small executable regression test for finding a sample user and admin, loading routes, and searching for a route. The deployed integration flow is tested separately through Tomcat HTTP requests.

## Module 10: Testing, Error Handling, and Final Integration

Module 10 verifies the complete architecture without adding DAO or Service layers:

```text
Frontend -> Java Servlets -> DatabaseOperations.java -> DBConnection.java -> Oracle 21c XE
```

### Error Handling

- Servlets validate required fields, email format, password confirmation, passenger count, route IDs, dates, payment methods, and route times.
- Database exceptions are handled inside the request flow and shown as simple error messages or JSON error responses.
- Oracle/JDBC details and passwords are not displayed in the browser.
- Sessions are checked before protected user and administrator operations.
- `DatabaseOperations.java` uses prepared statements, try-with-resources, transaction rollback for complete bookings, and meaningful SQL error messages.

### Final Test Coverage

The final local test run used JDK 17, Apache Tomcat 10.1.60, Oracle 21c XE, and the sample schema/data. The following checks passed:

- Public home page and Java compilation
- User registration, invalid registration, duplicate email, and invalid password input
- Valid and invalid user login
- Valid and invalid admin login
- Anonymous access redirection and logout/session invalidation
- USER access blocked from administrator pages and route-management requests
- Route search and invalid source/destination input
- Invalid passenger count and fare calculation for two and five passengers
- Ticket details and unique booking records
- QR code response generation as a PNG image
- Invoice generation and travel history retrieval
- Administrator route listing, add, update, and delete operations
- `DatabaseOperationsTest` for user, admin, route list, and route search JDBC operations

The verified application URL is:

```text
http://localhost:8080/PublicTransportTicketingSystem/
```

### Final Run Checklist

1. Start Oracle Database 21c XE and confirm the `XEPDB1` service is available.
2. Set `JAVA_HOME` to the JDK 17 installation and `CATALINA_HOME` to Apache Tomcat.
3. Set `DB_URL`, `DB_USERNAME`, and `DB_PASSWORD` in the same terminal used to start Tomcat.
4. Run `startup.bat` from Tomcat's `bin` folder.
5. Open the verified application URL.
6. Run `shutdown.bat` when the local test server is no longer required.

#### Start Tomcat from PowerShell

Run these commands in the same PowerShell window. The password is entered only
for the current terminal session and is not stored in the project:

```powershell
Set-Location 'D:\apache-tomcat-10.1.60\bin'
$env:JAVA_HOME = 'C:\Program Files\Java\jdk-17'
$env:JRE_HOME = $env:JAVA_HOME
$env:CATALINA_HOME = 'D:\apache-tomcat-10.1.60'
$env:CATALINA_BASE = $env:CATALINA_HOME
$env:DB_URL = 'jdbc:oracle:thin:@localhost:1521/XEPDB1'
$env:DB_USERNAME = 'SYSTEM'
$env:DB_PASSWORD = Read-Host 'Oracle password'
.\catalina.bat run
```

Keep that terminal open while using the application. For background startup,
replace the final command with `.\startup.bat`; use `.\shutdown.bat` to stop it.

If Oracle reports `ORA-28000: the account is locked`, unlock the local
development account in SQL*Plus as SYSDBA, then restart Tomcat:

```sql
ALTER USER SYSTEM IDENTIFIED BY "your-local-password" ACCOUNT UNLOCK CONTAINER=ALL;
```

Generated Tomcat classes and runtime libraries are kept outside the Git repository deployment copy. Database credentials must remain local and must not be committed.

## Admin Login and Admin Console

### Login popup

Opening the home page shows a welcome popup titled **Public Transport Ticketing System**. It offers:

- **User Login**: email and password, posted to `LoginServlet`. On success the user goes to `user-dashboard.html`.
- **Admin Login**: username and password, posted to `AdminLoginServlet`. On success the admin goes to `admin-dashboard.html`. A **Demo Credentials** box shows `admin` / `Admin@123` and has a button that fills them in.
- **Register**: opens `register.html`.
- **Back**: returns to the choice screen.

The popup also opens from the navbar **Login** link, and opens again after logout or when a protected page needs a login. Login errors appear inside the popup. The stand-alone `login.html` and `admin-login.html` pages still work and post to the same servlets. Neither login flow is duplicated.

### Admin authentication

- Admin login is separate from user login. It reads `ADMIN.USERNAME` and `ADMIN.PASSWORD_HASH` and never reads `USERS.PASSWORD`.
- Passwords are hashed with PBKDF2-HMAC-SHA256 (210,000 iterations, random 16-byte salt) in `util/PasswordHasher.java`. The format is `pbkdf2$<iterations>$<salt>$<hash>`, and hashes are compared in constant time.
- Credentials are always checked against the database. The demo values on screen are only a hint.
- All queries use `PreparedStatement`.
- `LoginAttemptLimiter` locks a username for 2 minutes after 5 failed admin login attempts.
- A successful login replaces the session (protects against session fixation). Admin sessions expire after 30 minutes.
- Database errors are logged on the server, and the browser shows a short "please try again" message.

To change the admin password, generate a new hash and update the row:

```powershell
java -cp frontend/WEB-INF/classes com.busticket.util.PasswordHasher "NewPassword@1"
```

```sql
UPDATE admin SET password_hash = '<printed hash>' WHERE username = 'admin';
COMMIT;
```

### Admin console pages

| Page | Contents |
|---|---|
| `admin-dashboard.html` | Total users, routes, bookings and revenue, plus recent bookings and quick actions |
| `route-management.html` | Add, edit, delete and list routes (`RouteManagementServlet`) |
| `admin-bookings.html` | All bookings with passenger, route, fare and status, plus search and a status filter |
| `admin-users.html` | Registered users with status and booking count, plus search |
| `admin-reports.html` | Revenue, passengers, bookings by status and the busiest routes |

These pages read JSON from `AdminDataServlet` at `/admin-data?view=summary|bookings|users|reports`. `AuthFilter` and the servlet itself both check for an admin session. **Logout** ends the session and returns to the login popup.

## MTC Route Data Import

The Oracle `ROUTES` table was populated from the official MTC route-wise information source:

<https://mtcbus.tn.gov.in/Home/bustimingsearch>

The source page listed 693 route options. The route-wise endpoint returned usable origin and destination values for 676 unique records, which were inserted with an Oracle `MERGE` so the import can be repeated without duplicating route numbers. The database now contains 684 routes: 676 imported MTC routes and the original 8 project sample routes.

Important data limitation: the MTC route-wise response provides route, origin, destination, and stage information, but not a route-specific fare and departure/arrival pair in the same response. Imported MTC records use `00:00` departure and `01:00` arrival as schedule placeholders. Development fares were assigned randomly in the `10.00`–`80.00` range so that fare calculation and booking can be tested; these are not official MTC fares and must be replaced with verified fare data before real ticket sales. Seventeen source options were excluded because the endpoint returned no usable route details or the values violated the project table constraints, such as identical source and destination.

The route search frontend now loads its source and destination dropdowns from the database through `RouteSearchServlet`; it is no longer limited to the original sample options. The official MTC page identifies its timing schedule as the latest schedule and displays its update date; route-wise data should be refreshed when MTC publishes changes. The project’s `ROUTES` table keeps the simple college-project schema and does not store all individual intermediate stages from the MTC site.
