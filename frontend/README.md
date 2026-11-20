# Teamflow frontend

React 19, React Router, Axios, Zustand, Tailwind CSS and Vite.

Start the full backend and Nginx from the repository root with `docker compose up -d --build`.

```powershell
npm.cmd ci
npm.cmd run dev
npm.cmd run build
```

Development runs at http://localhost:5173. Vite proxies all API requests to Nginx at http://localhost:8080. The Docker frontend is a compiled build served by Nginx, not a development server.

Features are grouped under `src/features/`; shared UI, authenticated HTTP requests, hooks and session state live under `src/shared/`. See the root README for OAuth configuration, optional admin provisioning, API tests and sample data.
