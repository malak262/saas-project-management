# Teamflow verification — 20 November 2026

All changes were made in the existing `saas-project-management` folder. No external deployment or repository was created.

| Check | Result |
| --- | --- |
| Production React/Vite build | Passed |
| Docker builds for all six services | Passed |
| Spring Boot tests | 7 passed across authentication, OAuth authorization and projects |
| Final Nginx gateway integration run | 63 successful HTTP checks |
| Frontend HTTP routing | 8 routes returned the Teamflow shell and working production assets |
| Gateway headers and Nginx configuration | Passed |
| PHP syntax checks | Passed |
| Git whitespace check | Passed |

The integration suite covers registration and login, prevention of role overrides, forged JWT rejection in all protected service types, workspace isolation, in-app invitations and acceptance, owner protection, project permissions, assignee membership checks, task filtering and updates, conflicting-edit errors, comments, notification delivery and ownership, profile updates, invalid avatars, and cleanup. Notification polling can vary the number of HTTP checks between runs.

OAuth authorization tests confirm that both Google and GitHub redirects include state and PKCE with S256. The full provider consent/callback flow needs real credentials in `.env` and a browser session; it has not been exercised against live provider accounts.

The available computer-use tool reported that both its native connection and browser host were unavailable. Visual browser inspection and touch-device interaction could not be performed. Responsive breakpoints, keyboard dialog handling and reduced-motion styles are implemented; the frontend compiles successfully.

The local Docker stack is running at `http://localhost:8080`. Registration is available immediately. Optional platform admin provisioning, OAuth setup, frontend development, sample data and startup commands are documented in the root README. No default account/password or automatic demo seed is installed. Automated test accounts use unique `@teamflow.test` addresses; their workspace, project and task data are removed by the test suite.

The .NET services were moved to .NET 10. The build identified a MySqlConnector advisory; the dependency was upgraded to patched version 2.6.1 before the final successful build. See the [maintainer advisory](https://github.com/mysql-net/MySqlConnector/security/advisories/GHSA-473q-m89c-ghf8).

Collaboration updates use periodic polling. Invitations are in-app. Outbound email, WebSockets and external production hosting are not configured.
