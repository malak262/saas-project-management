import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

const base = process.env.TEAMFLOW_URL || "http://localhost:8080";
const stamp = randomUUID().slice(0, 8);
const password = `Teamflow-${randomUUID()}!`;
let checks = 0;
async function request(method, path, body, token, expected = 200) {
  const response = await fetch(base + path, {
    method,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(20000),
  });
  const raw = await response.text();
  let data;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    throw new Error(
      `${method} ${path}: expected JSON, got ${raw.slice(0, 150)}`,
    );
  }
  assert.equal(
    response.status,
    expected,
    `${method} ${path}: ${JSON.stringify(data)}`,
  );
  checks++;
  return data;
}
async function register(name) {
  return request(
    "POST",
    "/api/auth/register",
    {
      name: `${name} ${stamp}`,
      email: `${name.toLowerCase()}-${stamp}@teamflow.test`,
      password,
      role: "ADMIN",
    },
    null,
    201,
  );
}
async function eventually(fn) {
  for (let i = 0; i < 20; i++) {
    const result = await fn();
    if (result) return result;
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("Timed out waiting for notification delivery.");
}

console.log(`Testing Teamflow through ${base}`);
await request("GET", "/health");
for (const path of [
  "/api/users/me",
  "/api/workspaces",
  "/api/projects",
  "/api/tasks",
  "/api/notifications",
])
  await request("GET", path, undefined, null, 401);
const forged = `${Buffer.from('{"alg":"none","typ":"JWT"}').toString("base64url")}.${Buffer.from(JSON.stringify({ sub: "1", iss: "teamflow", aud: ["teamflow"], exp: 9999999999, role: "ADMIN" })).toString("base64url")}.invalid`;
for (const path of [
  "/api/users/me",
  "/api/workspaces",
  "/api/projects",
  "/api/tasks",
  "/api/notifications",
])
  await request("GET", path, undefined, forged, 401);
await request("POST", "/internal/notifications", {}, null, 404);
const owner = await register("Owner");
const member = await register("Member");
const outsider = await register("Outsider");
assert.equal(owner.user.name, `Owner ${stamp}`);
assert.equal(owner.user.role, "MEMBER", "Registration must not accept a platform role override");
await request("PUT", `/api/auth/users/${member.user.id}/role`, {role:"ADMIN"}, owner.token, 403);
await request(
  "POST",
  "/api/auth/register",
  { name: "Duplicate", email: owner.user.email, password },
  null,
  409,
);
await request(
  "POST",
  "/api/auth/login",
  { email: owner.user.email, password: "incorrect-password" },
  null,
  401,
);
const login = await request("POST", "/api/auth/login", {
  email: owner.user.email.toUpperCase(),
  password,
});
assert.equal(login.user.id, owner.user.id);
await request("POST", "/api/workspaces", { name: "" }, owner.token, 422);
const workspace = await request(
  "POST",
  "/api/workspaces",
  {
    name: `Integration workspace ${stamp}`,
    description: "Automated collaboration verification",
  },
  owner.token,
  201,
);
assert.equal(workspace.role, "OWNER");
assert.equal(workspace.membersCount, 1);
await request(
  "GET",
  `/api/workspaces/${workspace.id}`,
  undefined,
  outsider.token,
  404,
);
await request(
  "POST",
  `/api/workspaces/${workspace.id}/members`,
  { email: member.user.email, role: "MEMBER" },
  owner.token,
  201,
);
await request(
  "POST",
  `/api/workspaces/${workspace.id}/members`,
  { email: member.user.email },
  owner.token,
  409,
);
const invites = await request(
  "GET",
  "/api/invitations",
  undefined,
  member.token,
);
const invitation = invites.find((i) => Number(i.workspaceId) === workspace.id);
assert.ok(invitation);
await request(
  "POST",
  `/api/invitations/${invitation.id}/accept`,
  {},
  outsider.token,
  404,
);
await request(
  "POST",
  `/api/invitations/${invitation.id}/accept`,
  {},
  member.token,
);
const joined = await request(
  "GET",
  `/api/workspaces/${workspace.id}`,
  undefined,
  member.token,
);
assert.equal(joined.membersCount, 2);
await request(
  "POST",
  `/api/workspaces/${workspace.id}/members`,
  { email: outsider.user.email },
  member.token,
  403,
);
await request(
  "DELETE",
  `/api/workspaces/${workspace.id}/members/${owner.user.id}`,
  undefined,
  owner.token,
  422,
);
await request(
  "POST",
  "/api/projects",
  { name: "Unauthorized", workspaceId: workspace.id },
  member.token,
  403,
);
const project = await request(
  "POST",
  "/api/projects",
  {
    name: `Project ${stamp}`,
    description: "A real six-service workflow",
    workspaceId: workspace.id,
    color: "#6366f1",
  },
  owner.token,
  201,
);
await request(
  "GET",
  `/api/projects/${project.id}`,
  undefined,
  outsider.token,
  404,
);
assert.equal(
  (await request("GET", "/api/projects", undefined, outsider.token)).length,
  0,
);
await request(
  "POST",
  "/api/tasks",
  {
    title: "Invalid assignment",
    projectId: project.id,
    assignedUser: outsider.user.id,
  },
  owner.token,
  422,
);
await request(
  "POST",
  "/api/tasks",
  { title: "Invalid status", projectId: project.id, status: "INVALID" },
  owner.token,
  422,
);
const task = await request(
  "POST",
  "/api/tasks",
  {
    title: `Ship Teamflow ${stamp}`,
    description: "Test collaboration and error handling",
    projectId: project.id,
    assignedUser: member.user.id,
    labels: ["Backend", "Release"],
    priority: "HIGH",
    dueDate: "2026-12-15",
  },
  owner.token,
  201,
);
assert.equal(task.version, 1);
assert.equal(task.assignedUser, member.user.id);
await request("GET", `/api/tasks/${task.id}`, undefined, outsider.token, 404);
const filtered = await request(
  "GET",
  `/api/tasks?projectId=${project.id}&status=TODO&assignedUser=${member.user.id}&q=Ship`,
  undefined,
  owner.token,
);
assert.equal(filtered.length, 1);
const changed = await request(
  "PUT",
  `/api/tasks/${task.id}`,
  { status: "IN_PROGRESS", version: 1 },
  member.token,
);
assert.equal(changed.version, 2);
await request(
  "PUT",
  `/api/tasks/${task.id}`,
  { status: "DONE", version: 1 },
  owner.token,
  409,
);
const comment = await request(
  "POST",
  `/api/tasks/${task.id}/comments`,
  { body: "The service integration looks good." },
  member.token,
  201,
);
assert.equal(comment.author.id, member.user.id);
const detailed = await request(
  "GET",
  `/api/tasks/${task.id}`,
  undefined,
  owner.token,
);
assert.equal(detailed.commentsCount, 1);
await request(
  "DELETE",
  `/api/tasks/${task.id}/comments/${comment.id}`,
  undefined,
  outsider.token,
  404,
);
const memberNotifications = await eventually(async () => {
  const rows = await request(
    "GET",
    "/api/notifications",
    undefined,
    member.token,
  );
  return rows.some((n) => n.title.includes("assigned")) &&
    rows.some((n) => n.title.includes("project"))
    ? rows
    : null;
});
await eventually(async () =>
  (await request("GET", "/api/notifications", undefined, owner.token)).some(
    (n) => n.title.includes("comment"),
  ),
);
const notification = memberNotifications[0];
await request(
  "PUT",
  `/api/notifications/${notification.id}/read`,
  {},
  outsider.token,
  404,
);
await request(
  "PUT",
  `/api/notifications/${notification.id}/read`,
  {},
  member.token,
  204,
);
await request("PUT", "/api/notifications/read-all", {}, member.token, 204);
assert.equal(
  (
    await request(
      "GET",
      "/api/notifications/unread-count",
      undefined,
      member.token,
    )
  ).count,
  0,
);
const profile = await request(
  "PUT",
  "/api/users/me",
  {
    name: `Updated ${stamp}`,
    bio: "Building together",
    jobTitle: "Engineer",
    avatarUrl: "",
  },
  member.token,
);
assert.equal(profile.name, `Updated ${stamp}`);
await request(
  "PUT",
  "/api/users/me",
  { name: "Invalid avatar", avatarUrl: "javascript:alert(1)" },
  member.token,
  422,
);
await request(
  "PUT",
  `/api/workspaces/${workspace.id}/members/${owner.user.id}/role`,
  { role: "MEMBER" },
  owner.token,
  422,
);
await request(
  "PUT",
  `/api/workspaces/${workspace.id}/members/${member.user.id}/role`,
  { role: "ADMIN" },
  owner.token,
);
await request(
  "DELETE",
  `/api/projects/${project.id}`,
  undefined,
  member.token,
  403,
);
await request(
  "DELETE",
  `/api/workspaces/${workspace.id}`,
  undefined,
  owner.token,
  409,
);
await request(
  "DELETE",
  `/api/tasks/${task.id}/comments/${comment.id}`,
  undefined,
  member.token,
  204,
);
await request("DELETE", `/api/tasks/${task.id}`, undefined, owner.token, 204);
await request(
  "DELETE",
  `/api/projects/${project.id}`,
  undefined,
  owner.token,
  204,
);
await request(
  "GET",
  `/api/projects/${project.id}`,
  undefined,
  owner.token,
  404,
);
await request(
  "DELETE",
  `/api/workspaces/${workspace.id}`,
  undefined,
  owner.token,
  204,
);
console.log(
  `PASS: ${checks} HTTP checks; authentication, isolation, invitations, roles, projects, tasks, optimistic locking, comments, notifications, profile and cleanup.`,
);
