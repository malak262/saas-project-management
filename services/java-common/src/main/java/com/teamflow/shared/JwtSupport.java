package com.teamflow.shared;

import java.nio.charset.StandardCharsets;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.context.annotation.*;
import org.springframework.core.env.Environment;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.*;

@Configuration
public class JwtSupport {

  @Bean
  JwtDecoder jwtDecoder(Environment env) {
    String secret = env.getRequiredProperty("JWT_SECRET");
    if (
      secret.getBytes(StandardCharsets.UTF_8).length < 32
    ) throw new IllegalStateException("JWT_SECRET must be at least 32 bytes");
    var decoder = NimbusJwtDecoder.withSecretKey(
      new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256")
    )
      .macAlgorithm(MacAlgorithm.HS256)
      .build();
    decoder.setJwtValidator(
      new org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator<>(
        JwtValidators.createDefaultWithIssuer("teamflow"),
        new JwtClaimValidator<java.util.List<String>>(
          "aud",
          a -> a != null && a.contains("teamflow")
        )
      )
    );
    return decoder;
  }

  public static void resourceServer(HttpSecurity http) throws Exception {
    http
      .oauth2ResourceServer(o ->
        o
          .jwt(j -> {})
          .authenticationEntryPoint((req, res, e) -> {
            res.setStatus(401);
            res.setContentType("application/json");
            res
              .getWriter()
              .write(
                "{\"error\":{\"status\":401,\"message\":\"Please sign in to continue.\"}}"
              );
          })
      )
      .exceptionHandling(e ->
        e.accessDeniedHandler((req, res, ex) -> {
          res.setStatus(403);
          res.setContentType("application/json");
          res
            .getWriter()
            .write(
              "{\"error\":{\"status\":403,\"message\":\"You do not have permission for this action.\"}}"
            );
        })
      );
  }
}
