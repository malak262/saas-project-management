# saas-project-management
SaaS Project Management Platform using Microservices

This is the clean backlog. Build it in this order:

1. Auth Service
2. User Service
3. Workspace Service
4. Project Service
5. Task Service
6. Notification Service
7. Gateway
8. Frontend
9. Docker integration
10. Testing


## Frontend Structure

The frontend is built with React and organized by feature.
The goal is to keep the project clean, scalable, and easy to maintain.

```txt
frontend/
├── public/
│   └── vite.svg
│
├── src/
│   ├── app/
│   │   ├── App.jsx
│   │   ├── router.jsx
│   │   └── ProtectedRoute.jsx
│   │
│   ├── layouts/
│   │   ├── AuthLayout.jsx
│   │   └── DashboardLayout.jsx
│   │
│   ├── features/
│   │   ├── auth/
│   │   │   ├── pages/
│   │   │   │   ├── LoginPage.jsx
│   │   │   │   ├── RegisterPage.jsx
│   │   │   │   ├── ForgotPasswordPage.jsx
│   │   │   │   └── ResetPasswordPage.jsx
│   │   │   ├── components/
│   │   │   │   └── AuthCard.jsx
│   │   │   └── services/
│   │   │       └── authService.js
│   │   │
│   │   ├── dashboard/
│   │   │   └── pages/
│   │   │       └── DashboardPage.jsx
│   │   │
│   │   ├── workspace/
│   │   │   ├── pages/
│   │   │   │   └── WorkspacePage.jsx
│   │   │   ├── components/
│   │   │   │   ├── WorkspaceCard.jsx
│   │   │   │   ├── MemberList.jsx
│   │   │   │   └── InviteMemberModal.jsx
│   │   │   └── services/
│   │   │       └── workspaceService.js
│   │   │
│   │   ├── project/
│   │   │   ├── pages/
│   │   │   │   ├── ProjectsPage.jsx
│   │   │   │   └── ProjectDetailsPage.jsx
│   │   │   ├── components/
│   │   │   │   ├── ProjectCard.jsx
│   │   │   │   ├── ProjectHeader.jsx
│   │   │   │   └── NewProjectModal.jsx
│   │   │   └── services/
│   │   │       └── projectService.js
│   │   │
│   │   ├── task/
│   │   │   ├── pages/
│   │   │   │   └── TasksPage.jsx
│   │   │   ├── components/
│   │   │   │   ├── KanbanBoard.jsx
│   │   │   │   ├── KanbanColumn.jsx
│   │   │   │   ├── TaskCard.jsx
│   │   │   │   ├── TaskModal.jsx
│   │   │   │   ├── TaskCommentList.jsx
│   │   │   │   └── NewTaskModal.jsx
│   │   │   └── services/
│   │   │       └── taskService.js
│   │   │
│   │   ├── notification/
│   │   │   ├── pages/
│   │   │   │   └── NotificationsPage.jsx
│   │   │   ├── components/
│   │   │   │   ├── NotificationItem.jsx
│   │   │   │   └── NotificationDropdown.jsx
│   │   │   └── services/
│   │   │       └── notificationService.js
│   │   │
│   │   └── settings/
│   │       └── pages/
│   │           └── SettingsPage.jsx
│   │
│   ├── shared/
│   │   ├── components/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Topbar.jsx
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Badge.jsx
│   │   │   ├── Avatar.jsx
│   │   │   └── Loader.jsx
│   │   │
│   │   ├── services/
│   │   │   └── api.js
│   │   │
│   │   ├── store/
│   │   │   ├── authStore.js
│   │   │   ├── workspaceStore.js
│   │   │   ├── projectStore.js
│   │   │   ├── taskStore.js
│   │   │   └── notificationStore.js
│   │   │
│   │   ├── utils/
│   │   │   ├── constants.js
│   │   │   ├── formatDate.js
│   │   │   └── token.js
│   │   │
│   │   └── styles/
│   │       └── theme.css
│   │
│   ├── assets/
│   │   ├── logo.svg
│   │   └── images/
│   │
│   ├── main.jsx
│   └── index.css
│
├── Dockerfile
├── nginx.conf
├── package.json
├── vite.config.js
├── tailwind.config.js
└── postcss.config.js
```

---

## Main Frontend Routes

```txt
/login
/register
/forgot-password
/reset-password
/dashboard
/workspaces/:workspaceId
/projects
/projects/:projectId
/tasks
/notifications
/settings
```

---

## Sidebar Navigation

The sidebar should contain only the features that exist in the project.

```txt
Home
Workspace
Projects
Tasks
Notifications
Settings
```

The following sections are not included in the MVP:

```txt
Calendar
Docs
Automations
Reporting
Releases
Apps
```

---

## Folder Responsibilities

### `src/app`

Contains the global React application setup.

```txt
App.jsx
router.jsx
ProtectedRoute.jsx
```

Responsibilities:

* Configure the main application.
* Define application routes.
* Protect private routes using JWT authentication.

---

### `src/layouts`

Contains reusable page layouts.

```txt
AuthLayout.jsx
DashboardLayout.jsx
```

Responsibilities:

* `AuthLayout.jsx`: layout for login, register, forgot password, and reset password pages.
* `DashboardLayout.jsx`: layout for authenticated pages with sidebar and topbar.

---

### `src/features/auth`

Contains authentication pages, components, and API calls.

Pages:

```txt
LoginPage.jsx
RegisterPage.jsx
ForgotPasswordPage.jsx
ResetPasswordPage.jsx
```

Responsibilities:

* User login.
* User registration.
* Forgot password flow.
* Reset password flow.
* Google login button UI.
* JWT storage after successful login.

---

### `src/features/dashboard`

Contains the main dashboard page.

```txt
DashboardPage.jsx
```

Responsibilities:

* Show user workspaces.
* Show recent tasks.
* Show notifications summary.
* Show project progress overview.

---

### `src/features/workspace`

Contains workspace-related pages and components.

Pages:

```txt
WorkspacePage.jsx
```

Components:

```txt
WorkspaceCard.jsx
MemberList.jsx
InviteMemberModal.jsx
```

Responsibilities:

* Show workspace details.
* Show workspace members.
* Invite members.
* Show projects inside a workspace.

---

### `src/features/project`

Contains project-related pages and components.

Pages:

```txt
ProjectsPage.jsx
ProjectDetailsPage.jsx
```

Components:

```txt
ProjectCard.jsx
ProjectHeader.jsx
NewProjectModal.jsx
```

Responsibilities:

* List all projects.
* Filter projects.
* Create new project.
* Show project details.
* Navigate to project board/list view.

---

### `src/features/task`

Contains task-related pages and components.

Pages:

```txt
TasksPage.jsx
```

Components:

```txt
KanbanBoard.jsx
KanbanColumn.jsx
TaskCard.jsx
TaskModal.jsx
TaskCommentList.jsx
NewTaskModal.jsx
```

Responsibilities:

* Display tasks.
* Display Kanban board.
* Create task.
* Update task.
* Change task status.
* Assign task to user.
* Add comments.
* Add labels.
* Filter tasks by status, priority, user, or project.

Kanban statuses:

```txt
TODO
IN_PROGRESS
DONE
```

---

### `src/features/notification`

Contains notification-related pages and components.

Pages:

```txt
NotificationsPage.jsx
```

Components:

```txt
NotificationItem.jsx
NotificationDropdown.jsx
```

Responsibilities:

* Show user notifications.
* Show unread notifications.
* Mark notification as read.
* Mark all notifications as read.
* Display notification dropdown in the topbar.

Notification types:

```txt
TASK_ASSIGNED
COMMENT_ADDED
PROJECT_CREATED
WORKSPACE_INVITATION
STATUS_CHANGED
```

---

### `src/features/settings`

Contains user settings page.

```txt
SettingsPage.jsx
```

Responsibilities:

* Display basic user settings.
* Allow user profile-related preferences later.

---

### `src/shared/components`

Contains reusable UI components used across the frontend.

```txt
Sidebar.jsx
Topbar.jsx
Button.jsx
Input.jsx
Modal.jsx
Badge.jsx
Avatar.jsx
Loader.jsx
```

Responsibilities:

* Avoid repeating UI code.
* Keep design consistent.
* Reuse common elements across pages.

---

### `src/shared/services`

Contains global API configuration.

```txt
api.js
```

Responsibilities:

* Configure Axios.
* Set backend base URL.
* Attach JWT token automatically.
* Handle unauthorized responses.

Example responsibility:

```txt
Every API request should include:
Authorization: Bearer <token>
```

---

### `src/shared/store`

Contains global state stores.

```txt
authStore.js
workspaceStore.js
projectStore.js
taskStore.js
notificationStore.js
```

Recommended state library:

```txt
Zustand
```

Responsibilities:

* Store authenticated user.
* Store JWT token.
* Store current workspace.
* Store current project.
* Store tasks.
* Store notifications.

---

### `src/shared/utils`

Contains helper functions and constants.

```txt
constants.js
formatDate.js
token.js
```

Responsibilities:

* Format dates.
* Manage token helpers.
* Store shared constants like task statuses, priorities, and roles.

---

### `src/shared/styles`

Contains global design styles.

```txt
theme.css
```

Responsibilities:

* Store dark theme variables.
* Store shared colors.
* Store reusable CSS variables.

Example values:

```css
:root {
  --bg-main: #0d0f12;
  --bg-card: #15171b;
  --border-color: #2a2d33;
  --text-main: #f5f5f5;
  --text-muted: #9ca3af;
}
```

---

## First Files to Build

Build the frontend in this order:

```txt
1. src/shared/services/api.js
2. src/shared/store/authStore.js
3. src/app/router.jsx
4. src/app/ProtectedRoute.jsx
5. src/layouts/AuthLayout.jsx
6. src/layouts/DashboardLayout.jsx
7. src/features/auth/pages/LoginPage.jsx
8. src/features/auth/pages/RegisterPage.jsx
9. src/features/auth/pages/ForgotPasswordPage.jsx
10. src/features/auth/pages/ResetPasswordPage.jsx
11. src/features/dashboard/pages/DashboardPage.jsx
12. src/features/workspace/pages/WorkspacePage.jsx
13. src/features/project/pages/ProjectsPage.jsx
14. src/features/project/pages/ProjectDetailsPage.jsx
15. src/features/task/components/KanbanBoard.jsx
16. src/features/task/components/TaskModal.jsx
17. src/features/notification/pages/NotificationsPage.jsx
```

---

## API Communication

The frontend must communicate only with the Nginx API Gateway.

Base URL:

```txt
http://localhost:8080/api
```

The frontend should not call services directly.

Bad:

```txt
http://localhost:8081/api/auth
http://localhost:8082/api/users
http://localhost:8083/api/workspaces
```

Good:

```txt
http://localhost:8080/api/auth
http://localhost:8080/api/users
http://localhost:8080/api/workspaces
http://localhost:8080/api/projects
http://localhost:8080/api/tasks
http://localhost:8080/api/notifications
```

---

## Frontend Design Direction

The frontend uses a dark SaaS dashboard style.

Design rules:

```txt
Dark background
Rounded cards
Soft borders
White primary buttons
Muted gray secondary text
Colored badges for status and priority
Left sidebar navigation
Topbar with search and notifications
Kanban board for tasks
Modal for task details
```

Main UI sections:

```txt
Authentication pages
Dashboard
Workspace page
Projects page
Project details page
Kanban board
Task details modal
Notifications page
Settings page
```

---

## MVP Frontend Scope

The MVP frontend should include:

```txt
Login page
Register page
Forgot password page
Reset password page
Dashboard page
Workspace page
Projects page
Project board page
Task modal
Notifications page
Settings page
```

Advanced features can be added later:

```txt
Drag and drop
Real-time notifications
Advanced search
Profile customization
File attachments
Activity logs
```
