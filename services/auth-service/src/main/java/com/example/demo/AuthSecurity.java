package com.example.demo;

import com.teamflow.shared.*;
import jakarta.servlet.http.HttpServletResponse;
import java.util.*;
import org.springframework.context.annotation.*;
import org.springframework.core.env.Environment;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientService;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.client.registration.*;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClient;

@Configuration
public class AuthSecurity {

  @Bean
  ClientRegistrationRepository registrations(Environment e) {
    List<ClientRegistration> list = new ArrayList<>();
    for (String p : List.of("google", "github")) {
      String id = e.getProperty(p.toUpperCase() + "_CLIENT_ID", "");
      String secret = e.getProperty(p.toUpperCase() + "_CLIENT_SECRET", "");
      if (id.isBlank() || secret.isBlank()) continue;
      var b = ClientRegistration.withRegistrationId(p)
        .clientId(id)
        .clientSecret(secret)
        .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
        .redirectUri(
          e.getRequiredProperty("PUBLIC_API_URL") +
            "/api/auth/oauth/callback/" +
            p
        )
        .clientName(p);
      if (p.equals("google")) b
        .scope("openid", "email", "profile")
        .authorizationUri("https://accounts.google.com/o/oauth2/v2/auth")
        .tokenUri("https://oauth2.googleapis.com/token")
        .jwkSetUri("https://www.googleapis.com/oauth2/v3/certs")
        .userInfoUri("https://openidconnect.googleapis.com/v1/userinfo")
        .userNameAttributeName("sub");
      else b
        .scope("read:user", "user:email")
        .authorizationUri("https://github.com/login/oauth/authorize")
        .tokenUri("https://github.com/login/oauth/access_token")
        .userInfoUri("https://api.github.com/user")
        .userNameAttributeName("id");
      list.add(b.build());
    }
    // Keep OAuth infrastructure available when credentials are intentionally unset.
    if (list.isEmpty()) list.add(
      ClientRegistration.withRegistrationId("unconfigured")
        .clientId("unconfigured")
        .clientSecret("unconfigured")
        .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
        .redirectUri("{baseUrl}/unused")
        .authorizationUri("https://invalid.invalid/authorize")
        .tokenUri("https://invalid.invalid/token")
        .userInfoUri("https://invalid.invalid/user")
        .userNameAttributeName("id")
        .build()
    );
    return new InMemoryClientRegistrationRepository(list);
  }

  @Bean
  SecurityFilterChain security(
    HttpSecurity http,
    Auth auth,
    Environment env,
    OAuth2AuthorizedClientService clients,
    ClientRegistrationRepository repository
  ) throws Exception {
    var resolver =
      new org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver(
        repository,
        "/api/auth/oauth/authorize"
      );
    resolver.setAuthorizationRequestCustomizer(
      org.springframework.security.oauth2.client.web.OAuth2AuthorizationRequestCustomizers.withPkce()
    );
    http
      .csrf(c -> c.disable())
      .authorizeHttpRequests(a ->
        a
          .requestMatchers("/api/auth/users/**")
          .authenticated()
          .requestMatchers("/api/auth/**", "/health")
          .permitAll()
          .anyRequest()
          .denyAll()
      );
    http.oauth2Login(o ->
      o
        .authorizationEndpoint(a ->
          a
            .baseUri("/api/auth/oauth/authorize")
            .authorizationRequestResolver(resolver)
        )
        .redirectionEndpoint(r -> r.baseUri("/api/auth/oauth/callback/*"))
        .successHandler((req, res, authentication) -> {
          try {
            var token = (OAuth2AuthenticationToken) authentication;
            String p = token.getAuthorizedClientRegistrationId();
            var user = token.getPrincipal();
            String email = user.getAttribute("email");
            String name = user.getAttribute("name");
            if (
              p.equals("google") &&
              !Boolean.TRUE.equals(user.getAttribute("email_verified"))
            ) throw new ApiException(
              403,
              "Please verify your Google email first."
            );
            if (p.equals("github")) {
              var authorized = clients.loadAuthorizedClient(
                p,
                authentication.getName()
              );
              var emails = RestClient.create()
                .get()
                .uri("https://api.github.com/user/emails")
                .header(
                  "Authorization",
                  "Bearer " + authorized.getAccessToken().getTokenValue()
                )
                .retrieve()
                .body(List.class);
              email = null;
              if (emails != null) for (Object item : emails) {
                var m = (Map<?, ?>) item;
                if (
                  Boolean.TRUE.equals(m.get("verified")) &&
                  Boolean.TRUE.equals(m.get("primary"))
                ) {
                  email = String.valueOf(m.get("email"));
                  break;
                }
              }
            }
            if (email == null) throw new ApiException(
              403,
              "Your provider must have a verified email address."
            );
            if (name == null || name.isBlank()) name = String.valueOf(
              Optional.ofNullable(user.getAttribute("login")).orElse(
                "Teamflow member"
              )
            );
            String code = auth.oauth(
              p,
              user.getName(),
              email.toLowerCase(Locale.ROOT),
              name
            );
            req.getSession().invalidate();
            res.sendRedirect(
              env.getRequiredProperty("FRONTEND_URL") +
                "/auth/callback?code=" +
                code
            );
          } catch (Exception ex) {
            if (req.getSession(false) != null) req.getSession().invalidate();
            res.sendRedirect(
              env.getRequiredProperty("FRONTEND_URL") +
                "/login?error=oauth_failed"
            );
          }
        })
        .failureHandler((req, res, e) ->
          res.sendRedirect(
            env.getRequiredProperty("FRONTEND_URL") +
              "/login?error=oauth_failed"
          )
        )
    );
    JwtSupport.resourceServer(http);
    return http.build();
  }

  @RestController
  static class PublicEndpoints {

    private final Environment env;

    PublicEndpoints(Environment e) {
      env = e;
    }

    @GetMapping("/health")
    Map<String, String> health() {
      return Map.of("status", "ok", "service", "auth");
    }

    @GetMapping("/api/auth/providers")
    Map<String, Boolean> providers() {
      var m = new LinkedHashMap<String, Boolean>();
      for (String p : List.of("google", "github"))
        m.put(
          p,
          !env.getProperty(p.toUpperCase() + "_CLIENT_ID", "").isBlank() &&
            !env.getProperty(p.toUpperCase() + "_CLIENT_SECRET", "").isBlank()
        );
      return m;
    }
  }
}
