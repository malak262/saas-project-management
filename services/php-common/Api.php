<?php
namespace Teamflow;

use PDO;
use Symfony\Component\HttpFoundation\{Request, JsonResponse};

class HttpError extends \RuntimeException
{
    public function __construct(
        public int $status,
        string $message,
        public array $fields = [],
    ) {
        parent::__construct($message);
    }
}

class Api
{
    public PDO $db;
    public string $token = "";
    public int $userId;
    public array $claims = [];
    public function __construct(public Request $request)
    {
        $this->db = new PDO(
            getenv("DATABASE_DSN"),
            getenv("DB_USER"),
            getenv("DB_PASSWORD"),
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ],
        );
    }
    public static function run(
        Request $request,
        callable $callback,
    ): JsonResponse {
        try {
            $api = new self($request);
            if ($request->getPathInfo() === "/health") {
                return new JsonResponse(["status" => "ok"]);
            }
            $api->authenticate();
            return $callback($api);
        } catch (HttpError $e) {
            return new JsonResponse(
                [
                    "error" => [
                        "status" => $e->status,
                        "message" => $e->getMessage(),
                        "fields" => $e->fields,
                    ],
                ],
                $e->status,
            );
        } catch (\PDOException $e) {
            error_log((string) $e);
            $status = $e->getCode() === "23000" ? 409 : 500;
            return new JsonResponse(
                [
                    "error" => [
                        "status" => $status,
                        "message" =>
                            $status === 409
                                ? "This record already exists or is still in use."
                                : "The database request failed. Please try again.",
                    ],
                ],
                $status,
            );
        } catch (\Throwable $e) {
            error_log((string) $e);
            return new JsonResponse(
                [
                    "error" => [
                        "status" => 500,
                        "message" => "Something went wrong. Please try again.",
                    ],
                ],
                500,
            );
        }
    }
    public function authenticate(): void
    {
        $header = $this->request->headers->get("Authorization", "");
        if (!preg_match('/^Bearer ([A-Za-z0-9_.-]+)$/D', $header, $match)) {
            throw new HttpError(401, "Please sign in to continue.");
        }
        $this->token = $match[1];
        $parts = explode(".", $this->token);
        try {
            if (count($parts) !== 3) {
                throw new \Exception();
            }
            $decode = fn($s) => base64_decode(strtr($s, "-_", "+/"), true);
            $h = json_decode(
                $decode($parts[0]),
                true,
                512,
                JSON_THROW_ON_ERROR,
            );
            $c = json_decode(
                $decode($parts[1]),
                true,
                512,
                JSON_THROW_ON_ERROR,
            );
            $secret = getenv("JWT_SECRET");
            if (strlen($secret) < 32) {
                throw new \LogicException(
                    "JWT_SECRET must be at least 32 bytes",
                );
            }
            if (
                ($h["alg"] ?? "") !== "HS256" ||
                !hash_equals(
                    hash_hmac(
                        "sha256",
                        $parts[0] . "." . $parts[1],
                        $secret,
                        true,
                    ),
                    $decode($parts[2]),
                )
            ) {
                throw new \Exception();
            }
            if (
                ($c["iss"] ?? "") !== "teamflow" ||
                !in_array("teamflow", (array) ($c["aud"] ?? []), true) ||
                !is_numeric($c["exp"] ?? null) ||
                $c["exp"] <= time() ||
                ($c["nbf"] ?? 0) > time() ||
                ($c["iat"] ?? 0) > time() + 30 ||
                !ctype_digit((string) ($c["sub"] ?? "")) ||
                (int) $c["sub"] < 1
            ) {
                throw new \Exception();
            }
            $this->claims = $c;
            $this->userId = (int) $c["sub"];
        } catch (\LogicException $e) {
            throw $e;
        } catch (\Throwable $e) {
            throw new HttpError(
                401,
                "Your session has expired. Please sign in again.",
            );
        }
    }
    public function query(string $sql, array $params = []): array
    {
        $s = $this->db->prepare($sql);
        $s->execute($params);
        return $s->columnCount() ? $s->fetchAll() : [];
    }
    public function one(
        string $sql,
        array $params = [],
        string $message = "Record not found.",
    ): array {
        $rows = $this->query($sql, $params);
        if (!$rows) {
            throw new HttpError(404, $message);
        }
        return $rows[0];
    }
    public function body(): array
    {
        try {
            $body = json_decode(
                $this->request->getContent(),
                true,
                512,
                JSON_THROW_ON_ERROR,
            );
            if (!is_array($body) || (array_is_list($body) && $body !== [])) {
                throw new \Exception();
            }
            return $body;
        } catch (\Throwable $e) {
            throw new HttpError(400, "Send a valid JSON object.");
        }
    }
    public function text(
        array $body,
        string $key,
        int $max,
        bool $required = false,
    ): string {
        $v = $body[$key] ?? "";
        if (
            !is_string($v) ||
            strlen($v) > $max ||
            ($required && trim($v) === "")
        ) {
            throw new HttpError(422, "Please check the highlighted fields.", [
                $key =>
                    "Enter " .
                    ($required ? "a value" : "text") .
                    " of at most $max characters.",
            ]);
        }
        return trim($v);
    }
    public function integer(mixed $value, string $field): int
    {
        if (
            filter_var($value, FILTER_VALIDATE_INT) === false ||
            (int) $value < 1
        ) {
            throw new HttpError(422, "Please check the highlighted fields.", [
                $field => "Choose a valid record.",
            ]);
        }
        return (int) $value;
    }
    public function choice(
        array $b,
        string $key,
        array $choices,
        string $default,
    ): string {
        $v = $b[$key] ?? $default;
        if (!is_string($v) || !in_array($v, $choices, true)) {
            throw new HttpError(422, "Please check the highlighted fields.", [
                $key => "Choose a valid option.",
            ]);
        }
        return $v;
    }
    public function http(
        string $service,
        string $method,
        string $path,
        ?array $body = null,
        bool $internal = false,
    ): mixed {
        $curl = curl_init(rtrim(getenv($service . "_URL"), "/") . $path);
        $headers = [
            "Accept: application/json",
            "Content-Type: application/json",
            "Authorization: Bearer " . $this->token,
        ];
        if ($internal) {
            $headers[] = "X-Service-Key: " . getenv("SERVICE_SECRET");
        }
        curl_setopt_array($curl, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_CONNECTTIMEOUT => 3,
            CURLOPT_TIMEOUT => 7,
        ]);
        if ($body !== null) {
            curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($body));
        }
        $raw = curl_exec($curl);
        $status = curl_getinfo($curl, CURLINFO_HTTP_CODE);
        curl_close($curl);
        if ($raw === false || $status >= 500 || $status === 0) {
            throw new HttpError(
                503,
                "A required service is temporarily unavailable. Please try again.",
            );
        }
        if ($status >= 400) {
            throw new HttpError(
                in_array($status, [401, 403, 404, 409, 422]) ? $status : 422,
                json_decode($raw, true)["error"]["message"] ??
                    "A related record could not be verified.",
            );
        }
        return $raw !== "" ? json_decode($raw, true) : null;
    }
    public function transaction(callable $fn): mixed
    {
        $this->db->beginTransaction();
        try {
            $result = $fn();
            $this->db->commit();
            return $result;
        } catch (\Throwable $e) {
            $this->db->rollBack();
            throw $e;
        }
    }
    private function bounded(string $text, int $bytes): string
    {
        $text = substr($text, 0, $bytes);
        while ($text !== "" && !preg_match("//u", $text)) {
            $text = substr($text, 0, -1);
        }
        return $text;
    }
    public function queue(
        int $userId,
        string $title,
        string $message,
        string $link,
    ): void {
        $this->query(
            "INSERT INTO outbox(event_id,user_id,title,message,link) VALUES(?,?,?,?,?)",
            [
                bin2hex(random_bytes(16)),
                $userId,
                $this->bounded($title, 180),
                $this->bounded($message, 450),
                $link,
            ],
        );
    }
    public function flush(): void
    {
        foreach (
            $this->query("SELECT * FROM outbox ORDER BY id LIMIT 50")
            as $row
        ) {
            try {
                $this->http(
                    "NOTIFICATION",
                    "POST",
                    "/internal/notifications",
                    [
                        "eventId" => $row["event_id"],
                        "userId" => (int) $row["user_id"],
                        "title" => $row["title"],
                        "message" => $row["message"],
                        "link" => $row["link"],
                    ],
                    true,
                );
                $this->query("DELETE FROM outbox WHERE id=?", [$row["id"]]);
            } catch (\Throwable $e) {
                error_log("Notification deferred: " . $e->getMessage());
                break;
            }
        }
    }
    public function reply(mixed $data, int $status = 200): JsonResponse
    {
        return new JsonResponse($data, $status);
    }
}
