package com.example.demo;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class DemoApplicationTests {

  @Autowired
  MockMvc http;

  @Test
  void validatesRegistrationBeforeProvisioning() throws Exception {
    http
      .perform(
        post("/api/auth/register")
          .contentType("application/json")
          .content(
            "{\"name\":\"\",\"email\":\"invalid\",\"password\":\"short\"}"
          )
      )
      .andExpect(status().isUnprocessableEntity())
      .andExpect(jsonPath("$.error.fields.email").exists());
  }

  @Test
  void rejectsReplayedOrUnknownOAuthCodes() throws Exception {
    http
      .perform(
        post("/api/auth/exchange")
          .contentType("application/json")
          .content("{\"code\":\"invalid-code\"}")
      )
      .andExpect(status().isUnauthorized());
  }

  @Test
  void missingProviderCredentialsAreExplicit() throws Exception {
    http
      .perform(get("/api/auth/providers"))
      .andExpect(status().isOk())
      .andExpect(jsonPath("$.google").value(false))
      .andExpect(jsonPath("$.github").value(false));
  }
}
