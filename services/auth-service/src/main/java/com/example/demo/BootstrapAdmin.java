package com.example.demo;

import com.teamflow.shared.ApiException;
import java.util.Locale;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class BootstrapAdmin implements ApplicationRunner {

  private final Environment env;
  private final JdbcTemplate db;

  BootstrapAdmin(Environment env, JdbcTemplate db) {
    this.env = env;
    this.db = db;
  }

  public void run(ApplicationArguments args) {
    String email = env
      .getProperty("TEAMFLOW_ADMIN_EMAIL", "")
      .trim()
      .toLowerCase(Locale.ROOT);
    String password = env.getProperty("TEAMFLOW_ADMIN_PASSWORD", "");
    if (email.isBlank() && password.isBlank()) return;
    if (
      !email.matches("[^@\\s]+@[^@\\s]+\\.[^@\\s]+") ||
      password.length() < 12 ||
      password.getBytes(java.nio.charset.StandardCharsets.UTF_8).length > 72
    ) throw new IllegalStateException(
      "Admin bootstrap requires a valid email and a password of 12 to 72 bytes."
    );
    var rows = db.queryForList(
      "SELECT id,role FROM accounts WHERE email=?",
      email
    );
    if (!rows.isEmpty()) {
      if (
        !"ADMIN".equals(rows.get(0).get("role"))
      ) throw new IllegalStateException(
        "Bootstrap email belongs to an existing member; use a platform admin to change their role."
      );
      return;
    }
    db.update(
      "INSERT INTO accounts(email,name,password_hash,role) VALUES(?,?,?,?)",
      email,
      "Teamflow Admin",
      new BCryptPasswordEncoder(12).encode(password),
      "ADMIN"
    );
  }
}
