package com.teamflow.shared;

import java.util.*;
import org.springframework.core.env.Environment;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.*;

@Component
public class Remote {

  private final RestClient client;
  private final Environment env;

  public Remote(Environment env) {
    this.env = env;
    var factory = new SimpleClientHttpRequestFactory();
    factory.setConnectTimeout(4000);
    factory.setReadTimeout(5000);
    client = RestClient.builder().requestFactory(factory).build();
  }

  public Object call(
    String service,
    String method,
    String path,
    String token,
    Object body,
    boolean internal
  ) {
    try {
      var request = client
        .method(org.springframework.http.HttpMethod.valueOf(method))
        .uri(env.getRequiredProperty(service + "_URL") + path);
      if (token != null) request.header("Authorization", "Bearer " + token);
      if (internal) request.header(
        "X-Service-Key",
        env.getRequiredProperty("SERVICE_SECRET")
      );
      if (body != null) request
        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
        .body(body);
      return request.retrieve().body(Object.class);
    } catch (HttpClientErrorException e) {
      if (e.getStatusCode().value() == 404) throw new ApiException(
        404,
        "The requested record was not found."
      );
      if (e.getStatusCode().value() == 403) throw new ApiException(
        403,
        "You do not have permission for this workspace."
      );
      if (e.getStatusCode().value() == 401) throw new ApiException(
        401,
        "Your session has expired. Please sign in again."
      );
      throw new ApiException(422, "A related record could not be verified.");
    } catch (RestClientException e) {
      throw new ApiException(
        503,
        "A required service is temporarily unavailable. Please try again."
      );
    }
  }

  @SuppressWarnings("unchecked")
  public Map<String, Object> workspace(long id, String token) {
    return (Map<String, Object>) call(
      "WORKSPACE",
      "GET",
      "/api/workspaces/" + id,
      token,
      null,
      false
    );
  }

  public void manager(Map<String, Object> w, boolean ownerOnly) {
    String role = String.valueOf(w.get("role"));
    if (
      !role.equals("OWNER") && (ownerOnly || !role.equals("ADMIN"))
    ) throw new ApiException(
      403,
      "Only a workspace " +
        (ownerOnly ? "owner" : "owner or admin") +
        " can do this."
    );
  }
}
