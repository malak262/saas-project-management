package com.saas.projectservice.dto;

public record ProjectResponse
        (Long id, String name, String description, Long workspaceId) { }
