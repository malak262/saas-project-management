package com.saas.projectservice;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class ProjectServiceApplicationTests {

  @Autowired
  MockMvc http;

  @Test
  void allProjectRoutesRequireAuthentication() throws Exception {
    http.perform(get("/api/projects")).andExpect(status().isUnauthorized());
    http
      .perform(
        post("/api/projects").contentType("application/json").content("{}")
      )
      .andExpect(status().isUnauthorized());
  }

  @Test
  void rejectsInvalidBearerTokens() throws Exception {
    http
      .perform(
        get("/api/projects").header(
          "Authorization",
          "Bearer invalid.invalid.invalid"
        )
      )
      .andExpect(status().isUnauthorized());
  }
}
