package com.example.demo;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import com.teamflow.shared.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.nio.charset.StandardCharsets;
import java.security.*;
import java.time.*;
import java.util.*;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class Auth {

  private final JdbcTemplate db;
  private final Remote remote;
  private final JwtEncoder encoder;
  private final BCryptPasswordEncoder passwords = new BCryptPasswordEncoder(12);

  public Auth(JdbcTemplate db, Remote remote, Environment env) {
    this.db = db;
    this.remote = remote;
    encoder = new NimbusJwtEncoder(
      new ImmutableSecret<>(
        new SecretKeySpec(
          env
            .getRequiredProperty("JWT_SECRET")
            .getBytes(StandardCharsets.UTF_8),
          "HmacSHA256"
        )
      )
    );
  }

  public record Register(
    @NotBlank @Size(min = 2, max = 100) String name,
    @NotBlank @Email @Size(max = 254) String email,
    @NotBlank @Size(min = 10, max = 72) String password
  ) {}

  public record Login(
    @NotBlank @Email String email,
    @NotBlank @Size(max = 72) String password
  ) {}

  public record Exchange(@NotBlank @Size(max = 200) String code) {}

  public record Role(@NotBlank @Pattern(regexp = "ADMIN|MEMBER") String role) {}

  @PutMapping("/users/{id}/role")
  public Map<String, Object> updateRole(
    @PathVariable long id,
    @Valid @RequestBody Role input,
    @org.springframework.security.core.annotation.AuthenticationPrincipal Jwt jwt
  ) {
    if (
      jwt == null || !"ADMIN".equals(jwt.getClaimAsString("role"))
    ) throw new ApiException(
      403,
      "Only platform admins can manage account roles."
    );
    if (Long.toString(id).equals(jwt.getSubject())) throw new ApiException(
      422,
      "You cannot change your own platform role."
    );
    var rows = db.queryForList("SELECT * FROM accounts WHERE id=?", id);
    if (rows.isEmpty()) throw new ApiException(404, "Account not found.");
    var a = rows.get(0);
    remote.call(
      "USER",
      "POST",
      "/internal/users",
      null,
      Map.of(
        "id",
        a.get("id"),
        "email",
        a.get("email"),
        "name",
        a.get("name"),
        "role",
        input.role()
      ),
      true
    );
    db.update("UPDATE accounts SET role=? WHERE id=?", input.role(), id);
    return Map.of("id", id, "role", input.role());
  }

  @PostMapping("/register")
  @ResponseStatus(org.springframework.http.HttpStatus.CREATED)
  public Map<String, Object> register(@Valid @RequestBody Register r) {
    String email = r.email().trim().toLowerCase(Locale.ROOT);
    if (
      !db.queryForList("SELECT id FROM accounts WHERE email=?", email).isEmpty()
    ) throw new ApiException(409, "An account with this email already exists.");
    if (
      r.password().getBytes(StandardCharsets.UTF_8).length > 72
    ) throw new ApiException(422, "Password must be at most 72 UTF-8 bytes.");
    db.update(
      "INSERT INTO accounts(email,name,password_hash) VALUES(?,?,?)",
      email,
      r.name().trim(),
      passwords.encode(r.password())
    );
    return session(
      db.queryForMap("SELECT * FROM accounts WHERE email=?", email)
    );
  }

  @PostMapping("/login")
  public Map<String, Object> login(@Valid @RequestBody Login r) {
    if (
      r.password().getBytes(StandardCharsets.UTF_8).length > 72
    ) throw new ApiException(401, "The email or password is incorrect.");
    var rows = db.queryForList(
      "SELECT * FROM accounts WHERE email=?",
      r.email().trim().toLowerCase(Locale.ROOT)
    );
    String dummy =
      "$2a$12$XIOU8jftCRuCJWX7w2sIBO4xBgSZUU5Gd2z4QZpClW2gu5QZ8oYgS";
    String hash = rows.isEmpty() || rows.get(0).get("password_hash") == null
      ? dummy
      : rows.get(0).get("password_hash").toString();
    boolean valid = passwords.matches(r.password(), hash);
    if (
      rows.isEmpty() || rows.get(0).get("password_hash") == null || !valid
    ) throw new ApiException(401, "The email or password is incorrect.");
    return session(rows.get(0));
  }

  @PostMapping("/exchange")
  @Transactional
  public Map<String, Object> exchange(@Valid @RequestBody Exchange r) {
    String hash = hash(r.code());
    var rows = db.queryForList(
      "SELECT * FROM login_codes WHERE code_hash=? AND expires_at>? FOR UPDATE",
      hash,
      Instant.now().getEpochSecond()
    );
    if (rows.isEmpty()) throw new ApiException(
      401,
      "This sign-in link has expired. Please try again."
    );
    db.update("DELETE FROM login_codes WHERE code_hash=?", hash);
    return session(
      db.queryForMap(
        "SELECT * FROM accounts WHERE id=?",
        rows.get(0).get("user_id")
      )
    );
  }

  public Map<String, Object> session(Map<String, Object> a) {
    var profile = new HashMap<String, Object>();
    profile.put("id", a.get("id"));
    profile.put("email", a.get("email"));
    profile.put("name", a.get("name"));
    profile.put("role", a.get("role"));
    Object user = remote.call(
      "USER",
      "POST",
      "/internal/users",
      null,
      profile,
      true
    );
    Instant now = Instant.now();
    var claims = JwtClaimsSet.builder()
      .issuer("teamflow")
      .audience(List.of("teamflow"))
      .subject(a.get("id").toString())
      .issuedAt(now)
      .expiresAt(now.plusSeconds(3600))
      .claim("role", a.get("role"))
      .id(UUID.randomUUID().toString())
      .build();
    String token = encoder
      .encode(
        JwtEncoderParameters.from(
          JwsHeader.with(MacAlgorithm.HS256).build(),
          claims
        )
      )
      .getTokenValue();
    return Map.of(
      "token",
      token,
      "expiresAt",
      now.plusSeconds(3600).toString(),
      "user",
      user
    );
  }

  public String oauth(
    String provider,
    String subject,
    String email,
    String name
  ) {
    var rows = db.queryForList(
      "SELECT * FROM accounts WHERE provider=? AND provider_id=?",
      provider,
      subject
    );
    if (rows.isEmpty()) {
      if (
        !db
          .queryForList("SELECT id FROM accounts WHERE email=?", email)
          .isEmpty()
      ) throw new ApiException(
        409,
        "An account already uses this email. Sign in with its original method."
      );
      db.update(
        "INSERT INTO accounts(email,name,provider,provider_id) VALUES(?,?,?,?)",
        email,
        name,
        provider,
        subject
      );
      rows = db.queryForList(
        "SELECT * FROM accounts WHERE provider=? AND provider_id=?",
        provider,
        subject
      );
    }
    remote.call(
      "USER",
      "POST",
      "/internal/users",
      null,
      Map.of(
        "id",
        rows.get(0).get("id"),
        "name",
        rows.get(0).get("name"),
        "email",
        rows.get(0).get("email"),
        "role",
        rows.get(0).get("role")
      ),
      true
    );
    String code = UUID.randomUUID().toString() + UUID.randomUUID();
    db.update(
      "DELETE FROM login_codes WHERE expires_at<?",
      Instant.now().getEpochSecond()
    );
    db.update(
      "INSERT INTO login_codes(code_hash,user_id,expires_at) VALUES(?,?,?)",
      hash(code),
      rows.get(0).get("id"),
      Instant.now().plusSeconds(60).getEpochSecond()
    );
    return code;
  }

  static String hash(String s) {
    try {
      return HexFormat.of().formatHex(
        MessageDigest.getInstance("SHA-256").digest(
          s.getBytes(StandardCharsets.UTF_8)
        )
      );
    } catch (Exception e) {
      throw new IllegalStateException(e);
    }
  }
}
