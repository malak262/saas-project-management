<?php
namespace App\Controller;
use Teamflow\{Api, HttpError};
use Symfony\Component\HttpFoundation\{Request, JsonResponse};
use Symfony\Component\Routing\Attribute\Route;
class WorkspaceController
{
    #[
        Route(
            "/{path}",
            requirements: ["path" => ".*"],
            defaults: ["path" => ""],
            methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        ),
    ]
    public function handle(Request $request): JsonResponse
    {
        return Api::run($request, fn(Api $a) => $this->dispatch($a));
    }
    private function now(): string
    {
        return gmdate("Y-m-d\TH:i:s\Z");
    }
    private function membership(
        Api $a,
        int $id,
        bool $manager = false,
        bool $owner = false,
    ): array {
        $w = $a->one(
            "SELECT w.*,m.role FROM workspaces w JOIN members m ON m.workspace_id=w.id WHERE w.id=? AND m.user_id=?",
            [$id, $a->userId],
            "Workspace not found or you are not a member.",
        );
        if (
            ($manager && !in_array($w["role"], ["OWNER", "ADMIN"], true)) ||
            ($owner && $w["role"] !== "OWNER")
        ) {
            throw new HttpError(
                403,
                $owner
                    ? "Only the workspace owner can do this."
                    : "Only workspace owners and admins can do this.",
            );
        }
        return $w;
    }
    private function output(Api $a, array $w, bool $details = false): array
    {
        $out = [
            "id" => (int) $w["id"],
            "name" => $w["name"],
            "description" => $w["description"],
            "ownerId" => (int) $w["owner_id"],
            "createdAt" => $w["created_at"],
            "role" => $w["role"],
            "membersCount" => (int) $a->query(
                "SELECT COUNT(*) AS total FROM members WHERE workspace_id=?",
                [$w["id"]],
            )[0]["total"],
        ];
        if ($details) {
            $out["members"] = [];
            foreach (
                $a->query(
                    "SELECT * FROM members WHERE workspace_id=? ORDER BY created_at,user_id",
                    [$w["id"]],
                )
                as $m
            ) {
                $user = $a->http(
                    "USER",
                    "GET",
                    "/internal/users/" . $m["user_id"],
                    null,
                    true,
                );
                $out["members"][] = array_merge($user, [
                    "userId" => (int) $m["user_id"],
                    "role" => $m["role"],
                    "joinedAt" => $m["created_at"],
                ]);
            }
            $out["invitations"] = in_array($w["role"], ["OWNER", "ADMIN"], true)
                ? $a->query(
                    "SELECT id,email,role,created_at AS createdAt FROM invitations WHERE workspace_id=?",
                    [$w["id"]],
                )
                : [];
        }
        return $out;
    }
    private function dispatch(Api $a): JsonResponse
    {
        $p = rtrim($a->request->getPathInfo(), "/");
        $method = $a->request->getMethod();
        if ($p === "/api/invitations" && $method === "GET") {
            $me = $a->http("USER", "GET", "/api/users/me");
            return $a->reply(
                $a->query(
                    "SELECT i.id,i.workspace_id AS workspaceId,w.name AS workspaceName,i.role,i.created_at AS createdAt FROM invitations i JOIN workspaces w ON w.id=i.workspace_id WHERE i.email=?",
                    [$me["email"]],
                ),
            );
        }
        if (
            preg_match('#^/api/invitations/(\d+)/(accept|decline)$#', $p, $m) &&
            $method === "POST"
        ) {
            $me = $a->http("USER", "GET", "/api/users/me");
            $invite = $a->one(
                "SELECT * FROM invitations WHERE id=? AND email=?",
                [(int) $m[1], $me["email"]],
                "Invitation not found.",
            );
            $a->transaction(function () use ($a, $invite, $m) {
                if ($m[2] === "accept") {
                    $a->query(
                        "INSERT INTO members(workspace_id,user_id,role,created_at) VALUES(?,?,?,?) ON DUPLICATE KEY UPDATE user_id=VALUES(user_id)",
                        [
                            $invite["workspace_id"],
                            $a->userId,
                            $invite["role"],
                            $this->now(),
                        ],
                    );
                }
                $a->query("DELETE FROM invitations WHERE id=?", [
                    $invite["id"],
                ]);
            });
            return $a->reply([
                "workspaceId" => (int) $invite["workspace_id"],
                "accepted" => $m[2] === "accept",
            ]);
        }
        if ($p === "/api/workspaces") {
            if ($method === "GET") {
                return $a->reply(
                    array_map(
                        fn($w) => $this->output($a, $w),
                        $a->query(
                            "SELECT w.*,m.role FROM workspaces w JOIN members m ON m.workspace_id=w.id WHERE m.user_id=? ORDER BY w.id DESC",
                            [$a->userId],
                        ),
                    ),
                );
            }
            if ($method === "POST") {
                $b = $a->body();
                $name = $a->text($b, "name", 100, true);
                $desc = $a->text($b, "description", 2000);
                $id = $a->transaction(function () use ($a, $name, $desc) {
                    $a->query(
                        "INSERT INTO workspaces(name,description,owner_id,created_at) VALUES(?,?,?,?)",
                        [$name, $desc, $a->userId, $this->now()],
                    );
                    $id = (int) $a->db->lastInsertId();
                    $a->query(
                        "INSERT INTO members(workspace_id,user_id,role,created_at) VALUES(?,?,?,?)",
                        [$id, $a->userId, "OWNER", $this->now()],
                    );
                    return $id;
                });
                return $a->reply(
                    $this->output($a, $this->membership($a, $id), true),
                    201,
                );
            }
        }
        if (preg_match('#^/api/workspaces/(\d+)(?:/(.*))?$#', $p, $m)) {
            $id = (int) $m[1];
            $sub = $m[2] ?? "";
            $w = $this->membership($a, $id);
            if ($sub === "") {
                if ($method === "GET") {
                    return $a->reply($this->output($a, $w, true));
                }
                if (in_array($method, ["PUT", "PATCH"])) {
                    $this->membership($a, $id, true);
                    $b = $a->body();
                    $a->query(
                        "UPDATE workspaces SET name=?,description=? WHERE id=?",
                        [
                            $a->text($b, "name", 100, true),
                            $a->text($b, "description", 2000),
                            $id,
                        ],
                    );
                    return $a->reply(
                        $this->output($a, $this->membership($a, $id), true),
                    );
                }
                if ($method === "DELETE") {
                    $this->membership($a, $id, false, true);
                    if (
                        count(
                            $a->http(
                                "PROJECT",
                                "GET",
                                "/api/projects?workspaceId=" . $id,
                            ),
                        )
                    ) {
                        throw new HttpError(
                            409,
                            "Delete the workspace projects before deleting this workspace.",
                        );
                    }
                    $a->query("DELETE FROM workspaces WHERE id=?", [$id]);
                    return $a->reply(null, 204);
                }
            }
            if ($sub === "members") {
                if ($method === "GET") {
                    return $a->reply($this->output($a, $w, true)["members"]);
                }
                if ($method === "POST") {
                    $this->membership($a, $id, true);
                    $b = $a->body();
                    $email = strtolower($a->text($b, "email", 254, true));
                    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                        throw new HttpError(
                            422,
                            "Enter a valid email address.",
                            ["email" => "Enter a valid email address."],
                        );
                    }
                    $role = $a->choice(
                        $b,
                        "role",
                        ["MEMBER", "ADMIN"],
                        "MEMBER",
                    );
                    if ($role === "ADMIN" && $w["role"] !== "OWNER") {
                        throw new HttpError(
                            403,
                            "Only the owner can invite an admin.",
                        );
                    }
                    $user = $a->http(
                        "USER",
                        "GET",
                        "/api/users?email=" . rawurlencode($email),
                    );
                    if (
                        $user &&
                        $a->query(
                            "SELECT user_id FROM members WHERE workspace_id=? AND user_id=?",
                            [$id, $user["id"]],
                        )
                    ) {
                        throw new HttpError(
                            409,
                            "This person is already a workspace member.",
                        );
                    }
                    $a->transaction(function () use (
                        $a,
                        $id,
                        $email,
                        $role,
                        $user,
                        $w,
                    ) {
                        $a->query(
                            "INSERT INTO invitations(workspace_id,email,role,created_at) VALUES(?,?,?,?)",
                            [$id, $email, $role, $this->now()],
                        );
                        if ($user) {
                            $a->queue(
                                (int) $user["id"],
                                "You are invited to " . $w["name"],
                                "Accept your invitation to start collaborating.",
                                "/workspaces",
                            );
                        }
                    });
                    return $a->reply(
                        [
                            "email" => $email,
                            "role" => $role,
                            "status" => "PENDING",
                        ],
                        201,
                    );
                }
            }
            if (
                preg_match('#^invitations/(\d+)$#', $sub, $im) &&
                $method === "DELETE"
            ) {
                $this->membership($a, $id, true);
                $a->query(
                    "DELETE FROM invitations WHERE id=? AND workspace_id=?",
                    [(int) $im[1], $id],
                );
                return $a->reply(null, 204);
            }
            if (preg_match('#^members/(\d+)(?:/(role))?$#', $sub, $mm)) {
                $uid = (int) $mm[1];
                $target = $a->one(
                    "SELECT * FROM members WHERE workspace_id=? AND user_id=?",
                    [$id, $uid],
                    "Member not found.",
                );
                if ($method === "GET") {
                    return $a->reply([
                        "isMember" => true,
                        "member" => [
                            "userId" => $uid,
                            "role" => $target["role"],
                        ],
                    ]);
                }
                if ($method === "DELETE") {
                    $this->membership($a, $id, true);
                    if ($target["role"] === "OWNER") {
                        throw new HttpError(
                            422,
                            "The owner cannot be removed.",
                        );
                    }
                    if ($target["role"] === "ADMIN" && $w["role"] !== "OWNER") {
                        throw new HttpError(
                            403,
                            "Only the owner can remove an admin.",
                        );
                    }
                    $a->query(
                        "DELETE FROM members WHERE workspace_id=? AND user_id=?",
                        [$id, $uid],
                    );
                    return $a->reply(null, 204);
                }
                if (in_array($method, ["PUT", "PATCH"]) && isset($mm[2])) {
                    $this->membership($a, $id, false, true);
                    if ($target["role"] === "OWNER") {
                        throw new HttpError(
                            422,
                            "The owner role cannot be changed.",
                        );
                    }
                    $role = $a->choice(
                        $a->body(),
                        "role",
                        ["ADMIN", "MEMBER"],
                        "MEMBER",
                    );
                    $a->query(
                        "UPDATE members SET role=? WHERE workspace_id=? AND user_id=?",
                        [$role, $id, $uid],
                    );
                    return $a->reply(["userId" => $uid, "role" => $role]);
                }
            }
        }
        throw new HttpError(404, "This endpoint does not exist.");
    }
}
