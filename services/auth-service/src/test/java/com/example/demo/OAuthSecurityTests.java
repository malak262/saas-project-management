package com.example.demo;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest(
  properties = {
    "GOOGLE_CLIENT_ID=test-google-client",
    "GOOGLE_CLIENT_SECRET=test-google-secret",
    "GITHUB_CLIENT_ID=test-github-client",
    "GITHUB_CLIENT_SECRET=test-github-secret",
  }
)
@AutoConfigureMockMvc
class OAuthSecurityTests {

  @Autowired
  MockMvc http;

  @Test
  void googleAuthorizationUsesStateAndPkce() throws Exception {
    http
      .perform(get("/api/auth/oauth/authorize/google"))
      .andExpect(status().is3xxRedirection())
      .andExpect(
        header().string(
          "Location",
          containsString("https://accounts.google.com/")
        )
      )
      .andExpect(header().string("Location", containsString("state=")))
      .andExpect(header().string("Location", containsString("code_challenge=")))
      .andExpect(
        header().string(
          "Location",
          containsString("code_challenge_method=S256")
        )
      );
  }

  @Test
  void githubAuthorizationUsesStateAndPkce() throws Exception {
    http
      .perform(get("/api/auth/oauth/authorize/github"))
      .andExpect(status().is3xxRedirection())
      .andExpect(
        header().string(
          "Location",
          containsString("https://github.com/login/oauth/authorize")
        )
      )
      .andExpect(header().string("Location", containsString("state=")))
      .andExpect(header().string("Location", containsString("code_challenge=")))
      .andExpect(
        header().string(
          "Location",
          containsString("code_challenge_method=S256")
        )
      );
  }
}
