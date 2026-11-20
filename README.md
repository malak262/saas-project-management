# Teamflow

A complete project management application built in the existing six-service repository. React communicates with Nginx; the services communicate over HTTP and own separate MySQL databases.

## First-time setup after cloning from GitHub

Follow these steps on a new machine. Docker supplies the application runtimes, dependencies, and databases.

1. **Install the prerequisites.** Install Git and Docker Desktop, then start Docker Desktop with its Linux container engine. Check that both commands work:

   ```sh
   git --version
   docker compose version
   ```

2. **Clone the repository and enter its folder.**

   ```sh
   git clone https://github.com/malak262/saas-project-management.git
   cd saas-project-management
   ```

   Run the remaining commands from this repository root.

3. **Create your local configuration.** On Windows, run:

   ```powershell
   powershell -ExecutionPolicy Bypass -File scripts/setup.ps1
   ```

   This generates `.env` with unique secrets and database passwords. It preserves an existing `.env`.

   On macOS or Linux, copy the example instead:

   ```sh
   cp .env.example .env
   ```

   Open `.env` and fill `JWT_SECRET`, `SERVICE_SECRET`, `DB_PASSWORD`, and `DB_ROOT_PASSWORD` with four different random values. Run `openssl rand -hex 32` once for each value. Keep `PUBLIC_API_URL` and `FRONTEND_URL` at `http://localhost:8080` for the default local setup. The `.env` file is ignored by Git.

4. **Configure optional sign-in methods or an admin account.** Email/password registration works immediately. To enable Google or GitHub, fill the OAuth credentials in `.env` and register the callback URLs in [Google and GitHub sign-in](#google-and-github-sign-in). To provision an admin, follow [Optional platform admin](#optional-platform-admin) before starting the containers.

5. **Build and start Teamflow.**

   ```sh
   docker compose up -d --build
   ```

   The first build can take several minutes while Docker downloads images and dependencies. The containers create their own database schemas automatically.

6. **Check that the services have started.**

   ```sh
   docker compose ps
   ```

   Services should show `Up`, and the database containers should show `healthy`. If a service is still starting or the app returns a temporary unavailable message, inspect its logs:

   ```sh
   docker compose logs --tail=100
   ```

7. **Open Teamflow and create your account.** Visit **http://localhost:8080**, select **Create an account**, then create your first workspace and project. Invite teammates using their email addresses; they accept invitations from their Workspaces page after signing in with the invited email. There are no default login credentials.

For later sessions, start Docker Desktop and run `docker compose up -d` from the repository root. Use `docker compose down` to stop Teamflow; the database volumes retain your data. Optional development tools, sample data, and tests are described in [Development and validation](#development-and-validation).

## Run locally

Install Docker Desktop, start its Linux container engine, then run from this folder:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/setup.ps1
docker compose up -d --build
```

Open **http://localhost:8080**. Create an account, create a workspace, invite a teammate by email, create a project, and start adding tasks. A teammate accepts invitations from their Workspaces page after signing in with the invited email. Invitations are in-app; no outbound email provider is required.

`scripts/setup.ps1` creates an ignored `.env` with unique random JWT, internal-service and database secrets. It preserves an existing `.env`. The first Docker build downloads the runtimes and dependencies and can take several minutes. Only Nginx is exposed to the host. Database volumes persist across `docker compose down`.

```powershell
docker compose ps
docker compose logs --tail=100
docker compose down
```

## Features

- Registration, BCrypt password login, one-hour signed JWT sessions, Google/GitHub OAuth with state and PKCE, verified provider emails and single-use login codes.
- Personal profiles, HTTPS avatars, optional platform administration, and workspace owner/admin/member permissions.
- Workspaces, in-app invitations, membership management and protected owner roles.
- Project creation, editing, workspace filtering and owner-only deletion. Deleted projects are archived; their tasks become inaccessible.
- Kanban and list views, drag and drop, task assignment, priorities, due dates, labels, search, assignee/status filters, comments and conflicting-edit protection.
- Durable notifications for invitations, project creation, assignments and comments, with retries and event deduplication.
- A responsive Teamflow interface, protected routes, loading/empty/error states, keyboard-accessible dialogs, inline validation and notifications.

## Google and GitHub sign-in

Provider credentials are not included. Create OAuth applications in your own accounts and fill the following ignored `.env` values:

```dotenv
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
PUBLIC_API_URL=http://localhost:8080
FRONTEND_URL=http://localhost:8080
```

Register these exact callback URLs:

| Provider | Authorized redirect / callback URL                     |
| -------- | ------------------------------------------------------ |
| Google   | `http://localhost:8080/api/auth/oauth/callback/google` |
| GitHub   | `http://localhost:8080/api/auth/oauth/callback/github` |

For Google, create a Web application OAuth client with basic `openid email profile` scopes and configure the consent screen/test users as required by your Google project. For GitHub, create an OAuth App with the homepage `http://localhost:8080` and the callback above. Teamflow requests only basic profile/email access. Provider buttons enable when their credentials are configured.

```powershell
docker compose up -d auth-service
```

OAuth identities are matched by provider and provider user ID. Teamflow deliberately requires an existing account's original sign-in method when a different provider returns an already registered email. Provider tokens remain on the server. Application JWTs are returned in JSON, never in redirect URLs. Browser sessions use session storage and expire after one hour; sign-out clears the local session.

Provider references: [Google web-server OAuth](https://developers.google.com/identity/protocols/oauth2/web-server), [GitHub OAuth authorization](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps).

## Optional platform admin

To provision the first platform admin, set a new, unused email and a strong password (12–72 UTF-8 bytes) in `.env` before starting/recreating auth:

```dotenv
TEAMFLOW_ADMIN_EMAIL=admin@yourcompany.com
TEAMFLOW_ADMIN_PASSWORD=your-unique-strong-password
```

Sign in with these credentials to access Administration. Platform admins can manage other accounts' platform roles. A platform role does not grant access to private workspaces. Workspace roles are managed independently by workspace owners. Role changes take effect on the next sign-in; existing JWTs expire within one hour. There are no default admin credentials.

## Development and validation

Node.js 24 is recommended. Run the backend through Docker, then optionally use Vite for frontend development:

```powershell
cd frontend
npm.cmd ci
npm.cmd run dev
```

Vite serves `http://localhost:5173` and proxies `/api` to Nginx. To test OAuth through Vite, set `FRONTEND_URL=http://localhost:5173` and recreate auth; keep the public API/callback URL at port 8080.

From the repository root:

```powershell
npm.cmd --prefix frontend run build
node scripts/test-api.mjs
```

The gateway integration suite creates unique test accounts, exercises collaboration, checks unauthorized access and validation failures, waits for notification delivery, and removes its tasks/projects/workspace. Test accounts and inbox entries remain isolated under `@teamflow.test` addresses.

Optional sample data is explicit and never installed automatically:

```powershell
$env:TEAMFLOW_DEMO_PASSWORD = 'choose-a-unique-local-password'
node scripts/seed-demo.mjs
```

Sign in as `alex@teamflow.test` using the password you supplied. `TEAMFLOW_DEMO_EMAIL` can override that address. The seed is idempotent for an existing Teamflow studio workspace.

## Service layout

| Service        | Stack                         | Database        |
| -------------- | ----------------------------- | --------------- |
| Authentication | Spring Boot / Spring Security | auth-db         |
| Users          | ASP.NET 10                    | user-db         |
| Workspaces     | Symfony 7.4 / PHP-FPM / Nginx | workspace-db    |
| Projects       | Spring Boot                   | project-db      |
| Tasks          | Symfony 7.4 / PHP-FPM / Nginx | task-db         |
| Notifications  | ASP.NET 10                    | notification-db |

Shared language utilities contain authentication, transport and error-handling code, and never share data. SQL schemas are version controlled beside each service. Workspaces and tasks run dedicated notification workers; projects have a scheduled outbox dispatcher. All requests to related resources are checked over authenticated HTTP with timeouts.

See [API documentation](docs/API.md), [Postman collection](docs/Teamflow.postman_collection.json), and [implementation notes](docs/IMPLEMENTATION.md).

For external deployment, configure HTTPS and your public origins, set `COOKIE_SECURE=true`, use production-managed secrets and database backups, and add explicit versioned migrations before changing populated schemas. Local Compose intentionally publishes HTTP on localhost. Live collaboration uses 10–15 second polling; WebSockets and outbound email are optional future integrations.
