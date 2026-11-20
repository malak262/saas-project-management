package com.saas.projectservice.controller;

import com.teamflow.shared.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.time.Instant;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

  private final JdbcTemplate db;
  private final Remote remote;

  public ProjectController(JdbcTemplate db, Remote remote) {
    this.db = db;
    this.remote = remote;
  }

  public record Input(
    @NotBlank @Size(max = 120) String name,
    @Size(max = 5000) String description,
    @NotNull @Positive Long workspaceId,
    @Pattern(regexp = "#[0-9a-fA-F]{6}") String color
  ) {}

  public Map<String, Object> find(long id) {
    var rows = db.queryForList(
      "SELECT * FROM projects WHERE id=? AND deleted=FALSE",
      id
    );
    if (rows.isEmpty()) throw new ApiException(404, "Project not found.");
    return rows.get(0);
  }

  Map<String, Object> output(Map<String, Object> p) {
    var m = new LinkedHashMap<String, Object>();
    m.put("id", p.get("id"));
    m.put("name", p.get("name"));
    m.put("description", p.get("description"));
    m.put("workspaceId", p.get("workspace_id"));
    m.put("createdBy", p.get("created_by"));
    m.put("createdAt", p.get("created_at"));
    m.put("color", p.get("color"));
    return m;
  }

  @GetMapping
  @SuppressWarnings("unchecked")
  public List<?> list(
    @RequestParam(required = false) Long workspaceId,
    @AuthenticationPrincipal Jwt jwt
  ) {
    if (workspaceId != null) {
      remote.workspace(workspaceId, jwt.getTokenValue());
      return db
        .queryForList(
          "SELECT * FROM projects WHERE workspace_id=? AND deleted=FALSE ORDER BY id DESC",
          workspaceId
        )
        .stream()
        .map(this::output)
        .toList();
    }
    var workspaces = (List<Map<String, Object>>) remote.call(
      "WORKSPACE",
      "GET",
      "/api/workspaces",
      jwt.getTokenValue(),
      null,
      false
    );
    Set<Long> ids = new HashSet<>();
    workspaces.forEach(w -> ids.add(((Number) w.get("id")).longValue()));
    return db
      .queryForList(
        "SELECT * FROM projects WHERE deleted=FALSE ORDER BY id DESC"
      )
      .stream()
      .filter(p -> ids.contains(((Number) p.get("workspace_id")).longValue()))
      .map(this::output)
      .toList();
  }

  @GetMapping("/workspace/{id}")
  public List<?> byWorkspace(
    @PathVariable long id,
    @AuthenticationPrincipal Jwt jwt
  ) {
    return list(id, jwt);
  }

  @GetMapping("/{id}")
  public Map<String, Object> get(
    @PathVariable long id,
    @AuthenticationPrincipal Jwt jwt
  ) {
    var p = find(id);
    remote.workspace(
      ((Number) p.get("workspace_id")).longValue(),
      jwt.getTokenValue()
    );
    return output(p);
  }

  @PostMapping
  @ResponseStatus(org.springframework.http.HttpStatus.CREATED)
  @Transactional
  public Map<String, Object> create(
    @Valid @RequestBody Input input,
    @AuthenticationPrincipal Jwt jwt
  ) {
    var workspace = remote.workspace(input.workspaceId(), jwt.getTokenValue());
    remote.manager(workspace, false);
    var key = new org.springframework.jdbc.support.GeneratedKeyHolder();
    db.update(
      c -> {
        var s = c.prepareStatement(
          "INSERT INTO projects(name,description,workspace_id,created_by,created_at,color) VALUES(?,?,?,?,?,?)",
          java.sql.Statement.RETURN_GENERATED_KEYS
        );
        s.setString(1, input.name().trim());
        s.setString(2, input.description() == null ? "" : input.description());
        s.setLong(3, input.workspaceId());
        s.setLong(4, Long.parseLong(jwt.getSubject()));
        s.setString(5, Instant.now().toString());
        s.setString(6, input.color() == null ? "#6366f1" : input.color());
        return s;
      },
      key
    );
    long id = Objects.requireNonNull(key.getKey()).longValue();
    var members = (List<?>) workspace.get("members");
    if (members != null) for (Object member : members) {
      var m = (Map<?, ?>) member;
      long uid = ((Number) m.get("userId")).longValue();
      if (uid != Long.parseLong(jwt.getSubject())) db.update(
        "INSERT INTO outbox(user_id,title,message,link) VALUES(?,?,?,?)",
        uid,
        "A new project is ready",
        input.name() + " was created in " + workspace.get("name"),
        "/projects/" + id
      );
    }
    return output(find(id));
  }

  @PutMapping("/{id}")
  public Map<String, Object> update(
    @PathVariable long id,
    @Valid @RequestBody Input input,
    @AuthenticationPrincipal Jwt jwt
  ) {
    var p = find(id);
    remote.manager(
      remote.workspace(
        ((Number) p.get("workspace_id")).longValue(),
        jwt.getTokenValue()
      ),
      false
    );
    if (
      ((Number) p.get("workspace_id")).longValue() != input.workspaceId()
    ) throw new ApiException(
      422,
      "A project cannot be moved to another workspace."
    );
    db.update(
      "UPDATE projects SET name=?,description=?,color=? WHERE id=?",
      input.name().trim(),
      input.description() == null ? "" : input.description(),
      input.color() == null ? p.get("color") : input.color(),
      id
    );
    return output(find(id));
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(org.springframework.http.HttpStatus.NO_CONTENT)
  public void delete(@PathVariable long id, @AuthenticationPrincipal Jwt jwt) {
    var p = find(id);
    remote.manager(
      remote.workspace(
        ((Number) p.get("workspace_id")).longValue(),
        jwt.getTokenValue()
      ),
      true
    );
    db.update("UPDATE projects SET deleted=TRUE WHERE id=?", id);
  }
}
