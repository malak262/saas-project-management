package com.saas.projectservice;

import com.teamflow.shared.*;
import java.util.Map;
import org.springframework.context.annotation.*;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.bind.annotation.*;

@Configuration
public class Security {

  @Bean
  SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
      .csrf(c -> c.disable())
      .sessionManagement(s ->
        s.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
      )
      .authorizeHttpRequests(a ->
        a.requestMatchers("/health").permitAll().anyRequest().authenticated()
      );
    JwtSupport.resourceServer(http);
    return http.build();
  }

  @RestController
  static class Health {

    @GetMapping("/health")
    Map<String, String> health() {
      return Map.of("status", "ok", "service", "project");
    }
  }
}
