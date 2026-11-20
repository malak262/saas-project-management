# Teamflow implementation

The supplied specification is the requirements source. The existing six-service architecture is retained: Spring Boot (authentication, projects), Symfony (workspaces, tasks), ASP.NET (users, notifications), React, Nginx and one MySQL database per service.

Required journeys: registration and login; Google/GitHub OAuth; profile editing; workspace creation and membership management; projects; Kanban tasks, assignment, priorities, labels and comments; notifications; responsive UI.

Security boundaries: JWT validation in every service, workspace membership checks on resources, owner/admin permissions for destructive operations, service credentials on internal HTTP endpoints, request validation and consistent JSON errors. Services never read another service's database.

Verification includes frontend compilation, service builds, and a gateway-level integration suite covering two-user collaboration and unauthorized access. OAuth provider sign-in additionally requires real provider credentials and an interactive browser consent flow.

Completed: authentication and platform roles; public/private profile boundaries; workspace invitations and membership permissions; project CRUD and workspace isolation; tasks, assignment, optimistic locking, comments, labels, filters and drag/drop; durable notifications; responsive React screens; Docker infrastructure; API documentation and a Postman collection. Old disconnected frontend pages and placeholder controllers were removed.

The implementation uses Symfony/PHP-FPM with Nginx and ASP.NET 10. Shared utilities contain code only. Each service owns its database, and cross-service checks use HTTP. Nginx resolves service DNS periodically so backend recreation does not leave stale upstream addresses.

See `VERIFICATION.md` for the final checks and the remaining external configuration steps.
