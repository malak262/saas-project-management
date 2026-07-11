package com.saas.projectservice.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ProjectController {

    @GetMapping("/api/projects")
    public String test() {
        return "Project Service OK";
    }
}