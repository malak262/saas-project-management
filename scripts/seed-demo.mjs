// Optional, explicit sample data for local design reviews. Never runs on startup.
const base = process.env.TEAMFLOW_URL || "http://localhost:8080";
const password = process.env.TEAMFLOW_DEMO_PASSWORD;
if (!password || password.length < 10)
  throw new Error(
    "Set TEAMFLOW_DEMO_PASSWORD to at least 10 characters before running this optional seed.",
  );
const email = process.env.TEAMFLOW_DEMO_EMAIL || "alex@teamflow.test";
let token;
async function call(method, path, body) {
  const r = await fetch(base + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await r.json();
  if (!r.ok)
    throw Object.assign(new Error(data.error?.message || "Request failed"), {
      status: r.status,
    });
  return data;
}
let session;
try {
  session = await call("POST", "/api/auth/register", {
    name: "Alex Morgan",
    email,
    password,
  });
} catch (e) {
  if (e.status !== 409) throw e;
  session = await call("POST", "/api/auth/login", { email, password });
}
token = session.token;
const existing = await call("GET", "/api/workspaces");
if (existing.some((w) => w.name === "Teamflow studio")) {
  console.log("Demo already exists. No duplicate data created.");
  process.exit(0);
}
const workspace = await call("POST", "/api/workspaces", {
  name: "Teamflow studio",
  description: "Thoughtful people building a better way to work.",
});
const specs = [
  [
    "Website redesign",
    "A fresh, thoughtful home for our next chapter.",
    "#8b7bd4",
  ],
  [
    "Mobile experience",
    "Make every little interaction feel effortless.",
    "#79a8cc",
  ],
  [
    "Brand identity",
    "Bring a little more personality to our world.",
    "#d59ab4",
  ],
];
const taskSpecs = [
  [
    "Explore the visual direction",
    "Collect references and find a clear point of view.",
    "IN_PROGRESS",
    "HIGH",
    ["Design", "Research"],
  ],
  [
    "Map the user journey",
    "A simpler path from first click to a little moment of delight.",
    "TODO",
    "MEDIUM",
    ["UX"],
  ],
  [
    "Build a flexible component library",
    "Shared foundations for a consistent experience.",
    "IN_PROGRESS",
    "HIGH",
    ["Design system"],
  ],
  [
    "Review the first concepts",
    "Bring the team together for fresh perspectives.",
    "DONE",
    "LOW",
    ["Review"],
  ],
];
for (const [name, description, color] of specs) {
  const p = await call("POST", "/api/projects", {
    name,
    description,
    color,
    workspaceId: workspace.id,
  });
  for (const [i, t] of taskSpecs.entries()) {
    const due = new Date();
    due.setDate(due.getDate() + i);
    await call("POST", "/api/tasks", {
      projectId: p.id,
      title: t[0],
      description: t[1],
      status: t[2],
      priority: t[3],
      labels: t[4],
      assignedUser: session.user.id,
      dueDate: due.toISOString().slice(0, 10),
    });
  }
}
console.log(`Demo ready. Sign in as ${email} using the password you supplied.`);
