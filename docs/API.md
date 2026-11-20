# Teamflow API

All browser requests use the Nginx gateway at `http://localhost:8080`. JSON is the request and response format. Import `Teamflow.postman_collection.json` into Postman for runnable examples.

Use `Authorization: Bearer <token>` on every endpoint except registration, login, the OAuth exchange, provider availability, and gateway health. Tokens expire after one hour. Profile and permission checks are enforced by the services, independently of the UI.

| Method    | Path                                             | Behavior / permission                                                      |
| --------- | ------------------------------------------------ | -------------------------------------------------------------------------- |
| GET       | `/health`                                        | Gateway availability                                                       |
| POST      | `/api/auth/register`                             | `{name,email,password}`; password 10–72 UTF-8 bytes; returns session, 201  |
| POST      | `/api/auth/login`                                | `{email,password}`; returns `{token,expiresAt,user}`                       |
| GET       | `/api/auth/providers`                            | Google/GitHub configuration availability                                   |
| GET       | `/api/auth/oauth/authorize/{google\|github}`     | Starts browser OAuth authorization                                         |
| GET       | `/api/auth/oauth/callback/{google\|github}`      | Provider callback; redirects with a single-use, 60-second code             |
| POST      | `/api/auth/exchange`                             | `{code}`; exchanges the single-use code for a session                      |
| PUT       | `/api/auth/users/{id}/role`                      | `{role: ADMIN\|MEMBER}`; platform admin, cannot change own role            |
| GET       | `/api/users/me`                                  | Current full profile                                                       |
| PUT       | `/api/users/me`                                  | `{name,jobTitle,bio,avatarUrl}`; avatar must use HTTPS                     |
| GET       | `/api/users?email=...`                           | Exact email lookup for workspace invitations; basic public profile or null |
| GET       | `/api/users`                                     | Registered accounts (first 200); platform admin only                       |
| GET       | `/api/users/{id}`                                | Basic public profile (name, avatar, job title); authenticated users only   |
| GET       | `/api/workspaces`                                | Current user's workspaces only                                             |
| POST      | `/api/workspaces`                                | `{name,description}`; requester automatically becomes owner                |
| GET       | `/api/workspaces/{id}`                           | Workspace, role, members, pending invitations; member only                 |
| PUT       | `/api/workspaces/{id}`                           | `{name,description}`; owner/admin                                          |
| DELETE    | `/api/workspaces/{id}`                           | Owner only; must contain no active projects                                |
| GET       | `/api/workspaces/{id}/members`                   | Workspace members; member only                                             |
| POST      | `/api/workspaces/{id}/members`                   | `{email,role}`; creates an in-app invitation; owner/admin                  |
| GET       | `/api/workspaces/{id}/members/{userId}`          | Membership verification; requester must belong to workspace                |
| PUT       | `/api/workspaces/{id}/members/{userId}/role`     | `{role: ADMIN\|MEMBER}`; owner only; owner role is immutable               |
| DELETE    | `/api/workspaces/{id}/members/{userId}`          | Owner/admin; admins cannot remove other admins; owner protected            |
| DELETE    | `/api/workspaces/{id}/invitations/{id}`          | Cancel pending invitation; owner/admin                                     |
| GET       | `/api/invitations`                               | Pending invitations matching the current account's email                   |
| POST      | `/api/invitations/{id}/accept`                   | Accept invitation matching the current email                               |
| POST      | `/api/invitations/{id}/decline`                  | Decline own invitation                                                     |
| GET       | `/api/projects`                                  | Projects in accessible workspaces                                          |
| GET       | `/api/projects?workspaceId={id}`                 | Projects in a workspace; member only                                       |
| GET       | `/api/projects/workspace/{id}`                   | Same workspace filter                                                      |
| POST      | `/api/projects`                                  | `{name,description,workspaceId,color}`; owner/admin                        |
| GET       | `/api/projects/{id}`                             | Project; workspace member only                                             |
| PUT       | `/api/projects/{id}`                             | Same fields as create; owner/admin; workspace cannot change                |
| DELETE    | `/api/projects/{id}`                             | Workspace owner only; archives project and blocks access to its tasks      |
| GET       | `/api/tasks`                                     | Tasks in accessible projects                                               |
| GET       | `/api/tasks?projectId=&status=&assignedUser=&q=` | Combine optional project, status, assignee, text filters                   |
| POST      | `/api/tasks`                                     | Create task; workspace member; see payload below                           |
| GET       | `/api/tasks/{id}`                                | Task and comments; workspace member                                        |
| PUT/PATCH | `/api/tasks/{id}`                                | Partial update plus required `version`; 409 on conflicting edit            |
| DELETE    | `/api/tasks/{id}`                                | Task creator or workspace owner/admin                                      |
| GET       | `/api/tasks/{id}/comments`                       | Task conversation                                                          |
| POST      | `/api/tasks/{id}/comments`                       | `{body}`; workspace member; notifies other participants                    |
| DELETE    | `/api/tasks/{id}/comments/{id}`                  | Comment author or workspace owner/admin                                    |
| GET       | `/api/notifications?limit=100&offset=0`          | Current user's inbox; limit 1–200                                          |
| GET       | `/api/notifications/unread-count`                | `{count}`                                                                  |
| PUT       | `/api/notifications/{id}/read`                   | Read own notification                                                      |
| PUT       | `/api/notifications/read-all`                    | Read all own notifications                                                 |
| DELETE    | `/api/notifications/{id}`                        | Delete own notification                                                    |

Task creation example:

```json
{
  "projectId": 1,
  "title": "Review the homepage",
  "description": "Collect feedback from the team.",
  "status": "TODO",
  "priority": "HIGH",
  "assignedUser": 2,
  "labels": ["Design", "Review"],
  "dueDate": "2026-12-15"
}
```

Task statuses are `TODO`, `IN_PROGRESS`, `DONE`. Priorities are `LOW`, `MEDIUM`, `HIGH`. Assignment is optional; an assignee must be an existing member of the project's workspace. Tasks support at most eight labels, each at most 24 bytes. A due date is optional. Task updates must include the version returned by the latest read:

```json
{ "status": "IN_PROGRESS", "version": 1 }
```

Error contract:

```json
{
  "error": {
    "status": 422,
    "message": "Please check the highlighted fields.",
    "fields": { "title": "Enter a value of at most 200 characters." }
  }
}
```

`fields` is optional. Responses use 400 for malformed requests, 401 for authentication, 403 for forbidden actions, 404 for missing/inaccessible records, 409 for duplicates or conflicting edits, 422 for validation, 429 for auth rate limiting, and 503 for a required service being unavailable. Internal exception details are logged server-side.

Internal user provisioning and notification delivery require `X-Service-Key` and are blocked at the gateway. Workspace and task outbox workers and the project scheduler retry pending notifications every five seconds. Notifications deduplicate on an event ID, so retries cannot create duplicate inbox entries.

The frontend polls tasks every 15 seconds and unread notification counts every 10 seconds while the tab is visible. WebSockets and outbound invitation email are not enabled; invitations are delivered inside Teamflow.
