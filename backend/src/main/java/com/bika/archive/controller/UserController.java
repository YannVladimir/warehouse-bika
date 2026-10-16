package com.bika.archive.controller;

import com.bika.archive.dto.request.CreateUserRequest;
import com.bika.archive.dto.request.UpdateUserRequest;
import com.bika.archive.dto.response.UserResponse;
import com.bika.archive.security.AuthenticatedPrincipal;
import com.bika.archive.service.UserService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('SUPER_ADMIN', 'COMPANY_ADMIN')")
@Tag(name = "Users")
public class UserController {

    private final UserService userService;

    @GetMapping
    public List<UserResponse> getAll(@AuthenticationPrincipal AuthenticatedPrincipal principal) {
        return userService.findAll(principal);
    }

    @GetMapping("/{id}")
    public UserResponse getById(@AuthenticationPrincipal AuthenticatedPrincipal principal, @PathVariable UUID id) {
        return userService.findById(principal, id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserResponse create(
            @AuthenticationPrincipal AuthenticatedPrincipal principal,
            @Valid @RequestBody CreateUserRequest request
    ) {
        return userService.create(principal, request);
    }

    @PutMapping("/{id}")
    public UserResponse update(
            @AuthenticationPrincipal AuthenticatedPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateUserRequest request
    ) {
        return userService.update(principal, id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal AuthenticatedPrincipal principal, @PathVariable UUID id) {
        userService.delete(principal, id);
    }

    @PatchMapping("/{id}/activate")
    public UserResponse activate(@AuthenticationPrincipal AuthenticatedPrincipal principal, @PathVariable UUID id) {
        return userService.setActive(principal, id, true);
    }

    @PatchMapping("/{id}/deactivate")
    public UserResponse deactivate(@AuthenticationPrincipal AuthenticatedPrincipal principal, @PathVariable UUID id) {
        return userService.setActive(principal, id, false);
    }
}
