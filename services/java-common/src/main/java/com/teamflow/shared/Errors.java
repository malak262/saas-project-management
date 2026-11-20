package com.teamflow.shared;

import java.util.*;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

@RestControllerAdvice
public class Errors {

  @ExceptionHandler(ApiException.class)
  ResponseEntity<?> expected(ApiException e) {
    return error(e.status, e.getMessage(), Map.of());
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  ResponseEntity<?> invalid(MethodArgumentNotValidException e) {
    Map<String, String> fields = new LinkedHashMap<>();
    e
      .getBindingResult()
      .getFieldErrors()
      .forEach(f -> fields.putIfAbsent(f.getField(), f.getDefaultMessage()));
    return error(422, "Please check the highlighted fields.", fields);
  }

  @ExceptionHandler(
    {
      HttpMessageNotReadableException.class,
      MethodArgumentTypeMismatchException.class,
      IllegalArgumentException.class,
    }
  )
  ResponseEntity<?> malformed(Exception e) {
    return error(400, "The request is invalid.", Map.of());
  }

  @ExceptionHandler(DataIntegrityViolationException.class)
  ResponseEntity<?> conflict(Exception e) {
    return error(
      409,
      "This record already exists or is still in use.",
      Map.of()
    );
  }

  @ExceptionHandler(NoResourceFoundException.class)
  ResponseEntity<?> missing(Exception e) {
    return error(404, "This endpoint does not exist.", Map.of());
  }

  @ExceptionHandler(
    org.springframework.web.HttpRequestMethodNotSupportedException.class
  )
  ResponseEntity<?> method(Exception e) {
    return error(
      405,
      "This method is not supported for this endpoint.",
      Map.of()
    );
  }

  @ExceptionHandler(Exception.class)
  ResponseEntity<?> unexpected(Exception e) {
    org.slf4j.LoggerFactory.getLogger(Errors.class).error("Request failed", e);
    return error(500, "Something went wrong. Please try again.", Map.of());
  }

  public static ResponseEntity<?> error(
    int status,
    String message,
    Map<?, ?> fields
  ) {
    return ResponseEntity.status(status).body(
      Map.of(
        "error",
        Map.of("status", status, "message", message, "fields", fields)
      )
    );
  }
}
