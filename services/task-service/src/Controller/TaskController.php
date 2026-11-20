<?php
namespace App\Controller;
use Teamflow\{Api, HttpError};
use Symfony\Component\HttpFoundation\{Request, JsonResponse};
use Symfony\Component\Routing\Attribute\Route;
class TaskController
{
    #[
        Route(
            "/{path}",
            requirements: ["path" => ".*"],
            defaults: ["path" => ""],
            methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
        ),
    ]
    public function handle(Request $r): JsonResponse
    {
        return Api::run($r, fn(Api $a) => $this->dispatch($a));
    }
    private function now(): string
    {
        return gmdate("Y-m-d\TH:i:s\Z");
    }
    private function context(Api $a, int $projectId): array
    {
        $project = $a->http("PROJECT", "GET", "/api/projects/" . $projectId);
        $workspace = $a->http(
            "WORKSPACE",
            "GET",
            "/api/workspaces/" . $project["workspaceId"],
        );
        return [$project, $workspace];
    }
    private function output(Api $a, array $t, bool $details = false): array
    {
        $out = [
            "id" => (int) $t["id"],
            "projectId" => (int) $t["project_id"],
            "title" => $t["title"],
            "description" => $t["description"],
            "status" => $t["status"],
            "priority" => $t["priority"],
            "assignedUser" =>
                $t["assigned_user"] === null ? null : (int) $t["assigned_user"],
            "createdBy" => (int) $t["created_by"],
            "labels" => json_decode($t["labels"], true),
            "dueDate" => $t["due_date"],
            "createdAt" => $t["created_at"],
            "updatedAt" => $t["updated_at"],
            "version" => (int) $t["version"],
            "commentsCount" => (int) $a->query(
                "SELECT COUNT(*) total FROM comments WHERE task_id=?",
                [$t["id"]],
            )[0]["total"],
        ];
        if ($details) {
            $out["comments"] = [];
            foreach (
                $a->query(
                    "SELECT * FROM comments WHERE task_id=? ORDER BY id",
                    [$t["id"]],
                )
                as $c
            ) {
                $user = $a->http(
                    "USER",
                    "GET",
                    "/internal/users/" . $c["user_id"],
                    null,
                    true,
                );
                $out["comments"][] = [
                    "id" => (int) $c["id"],
                    "userId" => (int) $c["user_id"],
                    "body" => $c["body"],
                    "createdAt" => $c["created_at"],
                    "author" => $user,
                ];
            }
        }
        return $out;
    }
    private function validate(
        Api $a,
        array $b,
        array $workspace,
        ?array $old = null,
    ): array {
        $merged = $old
            ? array_merge(
                [
                    "title" => $old["title"],
                    "description" => $old["description"],
                    "status" => $old["status"],
                    "priority" => $old["priority"],
                    "assignedUser" => $old["assigned_user"],
                    "labels" => json_decode($old["labels"], true),
                    "dueDate" => $old["due_date"],
                ],
                $b,
            )
            : $b;
        $title = $a->text($merged, "title", 200, true);
        $desc = $a->text($merged, "description", 10000);
        $status = $a->choice(
            $merged,
            "status",
            ["TODO", "IN_PROGRESS", "DONE"],
            "TODO",
        );
        $priority = $a->choice(
            $merged,
            "priority",
            ["LOW", "MEDIUM", "HIGH"],
            "MEDIUM",
        );
        $assigned = $merged["assignedUser"] ?? null;
        if ($assigned === "") {
            $assigned = null;
        }
        if ($assigned !== null) {
            $assigned = $a->integer($assigned, "assignedUser");
            if (!$old || array_key_exists("assignedUser", $b)) {
                $a->http("USER", "GET", "/api/users/" . $assigned);
                $ids = array_column($workspace["members"], "userId");
                if (!in_array($assigned, $ids, true)) {
                    throw new HttpError(
                        422,
                        "The assignee must belong to this workspace.",
                        ["assignedUser" => "Choose a workspace member."],
                    );
                }
            }
        }
        $labels = $merged["labels"] ?? [];
        if (
            !is_array($labels) ||
            !array_is_list($labels) ||
            count($labels) > 8
        ) {
            throw new HttpError(422, "Add at most 8 labels.");
        }
        foreach ($labels as &$label) {
            if (
                !is_string($label) ||
                strlen(trim($label)) < 1 ||
                strlen($label) > 24
            ) {
                throw new HttpError(
                    422,
                    "Labels must contain 1 to 24 characters.",
                );
            }
            $label = trim($label);
        }
        unset($label);
        $labels = array_values(array_unique($labels));
        $due = $merged["dueDate"] ?? null;
        if ($due === "") {
            $due = null;
        }
        if ($due !== null) {
            if (
                !is_string($due) ||
                !preg_match('/^(\d{4})-(\d{2})-(\d{2})$/D', $due, $m) ||
                !checkdate((int) $m[2], (int) $m[3], (int) $m[1])
            ) {
                throw new HttpError(422, "Choose a valid due date.", [
                    "dueDate" => "Choose a valid date.",
                ]);
            }
        }
        return [
            $title,
            $desc,
            $status,
            $priority,
            $assigned,
            json_encode($labels),
            $due,
        ];
    }
    private function dispatch(Api $a): JsonResponse
    {
        $p = rtrim($a->request->getPathInfo(), "/");
        $method = $a->request->getMethod();
        if ($p === "/api/tasks") {
            if ($method === "GET") {
                $projectId = $a->request->query->get("projectId");
                $projects = $a->http(
                    "PROJECT",
                    "GET",
                    "/api/projects" .
                        ($projectId !== null
                            ? "?workspaceId=" .
                                $this->workspaceId(
                                    $a,
                                    $a->integer($projectId, "projectId"),
                                )
                            : ""),
                );
                $ids = array_map("intval", array_column($projects, "id"));
                if ($projectId !== null) {
                    $ids = array_intersect($ids, [(int) $projectId]);
                }
                if (!$ids) {
                    return $a->reply([]);
                }
                $params = array_values($ids);
                $sql =
                    "SELECT * FROM tasks WHERE project_id IN (" .
                    implode(",", array_fill(0, count($params), "?")) .
                    ")";
                if ($a->request->query->has("status")) {
                    $s = $a->choice(
                        ["status" => $a->request->query->get("status")],
                        "status",
                        ["TODO", "IN_PROGRESS", "DONE"],
                        "TODO",
                    );
                    $sql .= " AND status=?";
                    $params[] = $s;
                }
                if ($a->request->query->has("assignedUser")) {
                    $sql .= " AND assigned_user=?";
                    $params[] = $a->integer(
                        $a->request->query->get("assignedUser"),
                        "assignedUser",
                    );
                }
                $rows = $a->query(
                    $sql . " ORDER BY updated_at DESC,id DESC",
                    $params,
                );
                $q = $a->request->query->get("q", "");
                if (!is_string($q) || strlen($q) > 200) {
                    throw new HttpError(
                        422,
                        "Search must be at most 200 characters.",
                    );
                }
                if ($q !== "") {
                    $rows = array_filter(
                        $rows,
                        fn($t) => stripos(
                            $t["title"] .
                                " " .
                                $t["description"] .
                                " " .
                                $t["labels"],
                            $q,
                        ) !== false,
                    );
                }
                return $a->reply(
                    array_values(
                        array_map(fn($t) => $this->output($a, $t), $rows),
                    ),
                );
            }
            if ($method === "POST") {
                $b = $a->body();
                $projectId = $a->integer($b["projectId"] ?? null, "projectId");
                [$project, $workspace] = $this->context($a, $projectId);
                $values = $this->validate($a, $b, $workspace);
                $id = $a->transaction(function () use (
                    $a,
                    $values,
                    $projectId,
                    $project,
                ) {
                    $now = $this->now();
                    $a->query(
                        "INSERT INTO tasks(title,description,status,priority,assigned_user,labels,due_date,project_id,created_by,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?,?,?,?)",
                        array_merge($values, [
                            $projectId,
                            $a->userId,
                            $now,
                            $now,
                        ]),
                    );
                    $id = (int) $a->db->lastInsertId();
                    if ($values[4] !== null && $values[4] !== $a->userId) {
                        $a->queue(
                            $values[4],
                            "A task is assigned to you",
                            $values[0] . " in " . $project["name"],
                            "/tasks?task=" . $id,
                        );
                    }
                    return $id;
                });
                return $a->reply(
                    $this->output(
                        $a,
                        $a->one("SELECT * FROM tasks WHERE id=?", [$id]),
                        true,
                    ),
                    201,
                );
            }
        }
        if (
            preg_match(
                '#^/api/tasks/(\d+)(?:/(comments)(?:/(\d+))?)?$#',
                $p,
                $m,
            )
        ) {
            $id = (int) $m[1];
            $task = $a->one(
                "SELECT * FROM tasks WHERE id=?",
                [$id],
                "Task not found.",
            );
            [$project, $workspace] = $this->context(
                $a,
                (int) $task["project_id"],
            );
            $comments = isset($m[2]);
            if (!$comments) {
                if ($method === "GET") {
                    return $a->reply($this->output($a, $task, true));
                }
                if (in_array($method, ["PUT", "PATCH"])) {
                    $b = $a->body();
                    if (
                        isset($b["projectId"]) &&
                        (int) $b["projectId"] !== (int) $task["project_id"]
                    ) {
                        throw new HttpError(
                            422,
                            "A task cannot be moved to another project.",
                        );
                    }
                    if (!isset($b["version"]) || !is_int($b["version"])) {
                        throw new HttpError(
                            422,
                            "The task version is required. Refresh and try again.",
                        );
                    }
                    $values = $this->validate($a, $b, $workspace, $task);
                    $a->transaction(function () use (
                        $a,
                        $values,
                        $id,
                        $b,
                        $task,
                        $project,
                    ) {
                        $s = $a->db->prepare(
                            "UPDATE tasks SET title=?,description=?,status=?,priority=?,assigned_user=?,labels=?,due_date=?,updated_at=?,version=version+1 WHERE id=? AND version=?",
                        );
                        $s->execute(
                            array_merge($values, [
                                $this->now(),
                                $id,
                                $b["version"],
                            ]),
                        );
                        if (!$s->rowCount()) {
                            throw new HttpError(
                                409,
                                "This task changed while you were editing it. Close and reopen it to get the latest version.",
                            );
                        }
                        if (
                            $values[4] !== null &&
                            $values[4] !== $a->userId &&
                            (int) $task["assigned_user"] !== $values[4]
                        ) {
                            $a->queue(
                                $values[4],
                                "A task is assigned to you",
                                $values[0] . " in " . $project["name"],
                                "/tasks?task=" . $id,
                            );
                        }
                    });
                    return $a->reply(
                        $this->output(
                            $a,
                            $a->one("SELECT * FROM tasks WHERE id=?", [$id]),
                            true,
                        ),
                    );
                }
                if ($method === "DELETE") {
                    if (
                        (int) $task["created_by"] !== $a->userId &&
                        !in_array($workspace["role"], ["OWNER", "ADMIN"], true)
                    ) {
                        throw new HttpError(
                            403,
                            "Only the task creator or a workspace admin can delete this task.",
                        );
                    }
                    $a->query("DELETE FROM tasks WHERE id=?", [$id]);
                    return $a->reply(null, 204);
                }
            } else {
                if ($method === "GET") {
                    return $a->reply(
                        $this->output($a, $task, true)["comments"],
                    );
                }
                if ($method === "POST" && !isset($m[3])) {
                    $b = $a->body();
                    $body = $a->text($b, "body", 5000, true);
                    $cid = $a->transaction(function () use (
                        $a,
                        $body,
                        $id,
                        $task,
                        $workspace,
                    ) {
                        $participants = $a->query(
                            "SELECT DISTINCT user_id FROM comments WHERE task_id=?",
                            [$id],
                        );
                        $a->query(
                            "INSERT INTO comments(task_id,user_id,body,created_at) VALUES(?,?,?,?)",
                            [$id, $a->userId, $body, $this->now()],
                        );
                        $cid = (int) $a->db->lastInsertId();
                        $recipients = array_unique(
                            array_merge(
                                array_column($participants, "user_id"),
                                [$task["assigned_user"], $task["created_by"]],
                            ),
                        );
                        $members = array_column(
                            $workspace["members"],
                            "userId",
                        );
                        foreach ($recipients as $uid) {
                            if (
                                $uid !== null &&
                                (int) $uid !== $a->userId &&
                                in_array((int) $uid, $members, true)
                            ) {
                                $a->queue(
                                    (int) $uid,
                                    "A new comment on " . $task["title"],
                                    strlen($body) > 200
                                        ? substr($body, 0, 197) . "..."
                                        : $body,
                                    "/tasks?task=" . $id,
                                );
                            }
                        }
                        return $cid;
                    });
                    $comments = $this->output($a, $task, true)["comments"];
                    return $a->reply(end($comments), 201);
                }
                if ($method === "DELETE" && isset($m[3])) {
                    $c = $a->one(
                        "SELECT * FROM comments WHERE id=? AND task_id=?",
                        [(int) $m[3], $id],
                    );
                    if (
                        (int) $c["user_id"] !== $a->userId &&
                        !in_array($workspace["role"], ["OWNER", "ADMIN"], true)
                    ) {
                        throw new HttpError(
                            403,
                            "You cannot delete this comment.",
                        );
                    }
                    $a->query("DELETE FROM comments WHERE id=?", [(int) $m[3]]);
                    return $a->reply(null, 204);
                }
            }
        }
        throw new HttpError(404, "This endpoint does not exist.");
    }
    private function workspaceId(Api $a, int $projectId): int
    {
        return (int) $a->http(
            "PROJECT",
            "GET",
            "/api/projects/" . $projectId,
        )["workspaceId"];
    }
}
