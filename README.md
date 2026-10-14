# Employee Management System (EMS)

A role-based employee management app with a .NET 10 Web API and a React frontend. Admins manage users, managers see their direct reports, and employees manage their own profile. Authentication uses short-lived JWT access tokens, an HttpOnly refresh cookie and a per-user `TokenVersion` that lets the server end sessions instantly.

## Features

- **Three roles**: Admin, Manager, Employee.
- **Admin**: create, edit, activate/deactivate and soft-delete users; reset passwords (temporary password emailed); change reporting managers; dashboard stats; searchable, sortable, paged employee list.
- **Manager**: view the employees reporting directly to them (search, sort, paging, stats), view their own manager, edit their own profile.
- **Employee**: edit own profile (name, phone), change password, view their reporting manager.
- **Forced password change** on first login and after an admin reset.
- **Optimistic concurrency** (`RowVersion`) on all updates.
- **Serilog** request and application logging; **Swagger UI** for the API.

## Business rules

- There is exactly one Admin. Admins cannot be created, promoted to, demoted, deleted or given a manager through the API.
- A reporting manager must be an active Manager or Admin.
- A manager can have a manager, but only a manager who reports directly to the Admin (or has no manager). Hierarchy depth is capped at Admin, Manager, Manager, Employee.
- Once an employee has a manager, they always have one; the manager can be changed but not removed.
- A manager cannot be deactivated, deleted or demoted to Employee while they have direct reports.
- You cannot deactivate or delete your own account.
- Deletion is soft (`Status = Deleted`). The unique email index is filtered (`Status <> 9`), so a deleted employee's email can be reused.
- Employee codes look like `EMP20260001` (`EMP` + year + 4-digit sequence).

## Authentication in brief

| | Access token | Refresh token |
| --- | --- | --- |
| Lifetime | 15 min | 1 day (7 days with Remember Me) |
| Stored | In memory (React) | HttpOnly cookie |
| Used for | Every API call (Bearer) | `POST /api/auth/refresh` only |

Every token carries the user's `TokenVersion`. `TokenVersionMiddleware` compares it with the database on every authenticated request, so an old token is rejected immediately. The version is incremented on login, refresh rotation, logout, password change or reset, deactivation, deletion and role change. A side effect is that a user has one active session at a time.

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React, Vite, React Router, axios, Tailwind CSS, jwt-decode |
| API | ASP.NET Core (.NET 10), JWT bearer auth, FluentValidation, Serilog, Swashbuckle |
| Business | Services, DTOs, validators, `Result` pattern, BCrypt.Net, MailKit |
| Data | Entity Framework Core 10, SQL Server |

## Project structure

```
EmployeeManagementSystem.Api            Controllers, middleware, Program.cs, DI/auth/Swagger extensions
EmployeeManagementSystem.Business       Services, DTOs, validators, Result type, JWT/password/email helpers
EmployeeManagementSystem.DataAccess     Employee entity, EF config, repositories, query extensions, migrations
src/                                    React app (pages, components, context, api/axios.js, hooks, utils)
```

Dependencies flow one way: Api, then Business, then DataAccess.

## API overview

| Endpoint | Access |
| --- | --- |
| `POST /api/auth/login`, `/refresh`, `/logout` | Anonymous |
| `POST /api/admin/employees` | Admin |
| `GET /api/admin/employees`, `GET /api/admin/employees/{code}` | Admin |
| `PUT /api/admin/employees/{code}` | Admin |
| `PATCH /api/admin/employees/{code}/status` | Admin |
| `PATCH /api/admin/employees/{code}/manager` | Admin |
| `DELETE /api/admin/employees/{code}` | Admin |
| `POST /api/admin/employees/{code}/reset-password` | Admin |
| `GET /api/admin/stats` | Admin |
| `GET /api/manager/employees`, `/employees/{code}`, `/stats` | Manager, Admin |
| `GET`, `PUT /api/profile` | Any logged-in user |
| `POST /api/profile/change-password` | Any logged-in user |
| `GET /api/profile/my-manager` | Any logged-in user |

Full request and response shapes are in Swagger UI.

## Getting started

### Prerequisites

- .NET 10 SDK
- SQL Server (LocalDB or a full instance)
- Node.js 18 or later
- An SMTP account (for example a Gmail app password) for the welcome and reset emails

### Backend

1. Set the connection string in `appsettings.json` (default: `Server=localhost;Database=EmployeeManagementSystemDb;Trusted_Connection=True;TrustServerCertificate=True;`).
2. Provide secrets, which are empty in `appsettings.json`. Use user secrets or environment variables rather than committing them:

   ```bash
   dotnet user-secrets set "JwtSettings:SecretKey" "<a long random string, 32+ characters>"
   dotnet user-secrets set "EmailSettings:Username" "<smtp username>"
   dotnet user-secrets set "EmailSettings:Password" "<smtp password>"
   dotnet user-secrets set "EmailSettings:FromEmail" "<sender address>"
   ```

3. Apply migrations:

   ```bash
   dotnet ef database update --project EmployeeManagementSystem.DataAccess --startup-project EmployeeManagementSystem.Api
   ```

4. Create the first Admin user directly in the database (admins cannot be created through the API). Insert a row into `Employees` with `Role = 1`, `Status = 1`, a BCrypt hash in `PasswordHash`, and an `EmployeeCode` such as `EMP20260001`.
5. Run the API:

   ```bash
   dotnet run --project EmployeeManagementSystem.Api
   ```

   Swagger UI is served at `/swagger`.

### Frontend

1. Create a `.env` file with the API base URL, for example:

   ```
   VITE_API_URL=https://localhost:<api-port>/api
   ```

2. Install and run:

   ```bash
   npm install
   npm run dev
   ```

The dev server runs at `http://localhost:5173`, which is already in the API's `AllowedOrigins`. Add other origins in `appsettings.json` under `AllowedOrigins`.

## Configuration reference

| Setting | Purpose |
| --- | --- |
| `ConnectionStrings:DefaultConnection` | SQL Server connection |
| `JwtSettings:Issuer`, `Audience`, `SecretKey` | Token signing and validation |
| `JwtSettings:AccessTokenExpiryMinutes`, `RefreshTokenExpiryDays` | Token lifetimes (15 and 7 by default) |
| `EmailSettings:*` | SMTP host, port, credentials and sender |
| `AllowedOrigins` | CORS origins allowed to call the API |
| `Serilog:*` | Console and rolling file logs (`Logs/log-.txt`, 14 days) |

## Notes

- The refresh cookie is `Secure` with `SameSite=None` outside Development, so production needs HTTPS.
- The refresh grace cache and refresh lock are in-process, so they apply per server instance.
- Never commit `JwtSettings:SecretKey` or SMTP credentials.
