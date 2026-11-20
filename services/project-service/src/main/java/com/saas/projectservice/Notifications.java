package com.saas.projectservice;

import com.teamflow.shared.Remote;
import java.util.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class Notifications {

  private final JdbcTemplate db;
  private final Remote remote;

  Notifications(JdbcTemplate db, Remote remote) {
    this.db = db;
    this.remote = remote;
  }

  @Scheduled(fixedDelay = 5000)
  public void deliver() {
    for (var row : db.queryForList(
      "SELECT * FROM outbox ORDER BY id LIMIT 50"
    )) {
      try {
        remote.call(
          "NOTIFICATION",
          "POST",
          "/internal/notifications",
          null,
          Map.of(
            "eventId",
            "project-" + row.get("id"),
            "userId",
            row.get("user_id"),
            "title",
            row.get("title"),
            "message",
            row.get("message"),
            "link",
            row.get("link")
          ),
          true
        );
        db.update("DELETE FROM outbox WHERE id=?", row.get("id"));
      } catch (Exception ex) {
        org.slf4j.LoggerFactory.getLogger(Notifications.class).warn(
          "Notification delivery deferred: {}",
          ex.getMessage()
        );
        break;
      }
    }
  }
}
