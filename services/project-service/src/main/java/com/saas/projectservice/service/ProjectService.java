package com.saas.projectservice.service;

import com.saas.projectservice.dto.ProjectRequest;
import com.saas.projectservice.dto.ProjectResponse;
import com.saas.projectservice.entity.Project;
import com.saas.projectservice.exception.ProjectNotFoundException;
import com.saas.projectservice.repository.ProjectRepository;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class ProjectService {
    private final ProjectRepository projectRepository;

    public ProjectService(ProjectRepository projectRepository) {
        this.projectRepository = projectRepository;
    }
    public ProjectResponse createProject(ProjectRequest request) {
        Project project = new Project();
        applyRequest(project, request);
        return toResponse(projectRepository.save(project));
    }
    public List<ProjectResponse> getAllProjects() {
        return projectRepository.findAll().stream().map(this::toResponse).toList();
    }
    public ProjectResponse getProjectById(Long id) {
        return toResponse(findProject(id));
    }
    public List<ProjectResponse> getProjectsByWorkspace(Long workspaceId) {
        return projectRepository.findByWorkspaceId(workspaceId).stream().map(this::toResponse).toList();
    }
    public ProjectResponse updateProject(Long id, ProjectRequest request) {
        Project project = findProject(id);
        applyRequest(project, request);
        return toResponse(projectRepository.save(project));
    }
    public void deleteProject(Long id) {
        projectRepository.delete(findProject(id));
    }
    private Project findProject(Long id) {
        return projectRepository.findById(id).orElseThrow(() -> new ProjectNotFoundException(id));
    }
    private void applyRequest(Project project, ProjectRequest request) {
        project.setName(request.name().trim());
        project.setDescription(request.description());
        project.setWorkspaceId(request.workspaceId());
    }
    private ProjectResponse toResponse(Project project) {
        return new ProjectResponse(project.getId(), project.getName(), project.getDescription(), project.getWorkspaceId());
    }
}
