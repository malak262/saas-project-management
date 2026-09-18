package com.saas.projectservice.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "projects")
public class Project {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;

    @Column(nullable = false, length = 120) private String name;

    @Column(columnDefinition = "TEXT") private String description;

    @Column(nullable = false) private Long workspaceId;

    public Long getId() {
        return id;
    }
    public String getName() {
        return name;
    }
    public void setName(String name) {
        this.name = name;
    }
    public String getDescription() {
        return description;
    }
    public void setDescription(String description) {
        this.description = description;
    }
    public Long getWorkspaceId() {
        return workspaceId;
    }
    public void setWorkspaceId(Long workspaceId) {
        this.workspaceId = workspaceId;
    }
}
