package com.teamflow.shared;

public class ApiException extends RuntimeException {

  public final int status;

  public ApiException(int status, String message) {
    super(message);
    this.status = status;
  }
}
