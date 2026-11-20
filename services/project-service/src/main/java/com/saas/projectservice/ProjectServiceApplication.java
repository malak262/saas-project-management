package com.saas.projectservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(
  scanBasePackages = { "com.saas.projectservice", "com.teamflow.shared" }
)
@org.springframework.scheduling.annotation.EnableScheduling
public class ProjectServiceApplication {

  public static void main(String[] args) {
    SpringApplication.run(ProjectServiceApplication.class, args);
  }
}
