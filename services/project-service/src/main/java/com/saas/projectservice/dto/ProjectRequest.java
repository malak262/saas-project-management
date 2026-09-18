package com.saas.projectservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ProjectRequest
(@NotBlank(message = "Le nom du projet est obligatoire.")
@Size(max = 120, message = "Le nom du projet ne peut pas dépasser 120 caractères.")
String name, @Size(max = 5000, message = "La description ne peut pas dépasser 5000 caractères.")
String description, @NotNull(message = "Le workspaceId est obligatoire.") Long workspaceId) { }
