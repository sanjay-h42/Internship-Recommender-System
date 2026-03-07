package com.internship.backend.controller;

import com.internship.backend.dto.UserResponse;
import com.internship.backend.model.User;
import com.internship.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;

    /**
     * Returns the currently logged-in user's profile.
     * Returns 401 if not authenticated.
     */
    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser(
            @AuthenticationPrincipal OidcUser oidcUser) {

        if (oidcUser == null) {
            return ResponseEntity.status(401).build();
        }

        User user = userService.loadOrCreateUser(oidcUser);

        return ResponseEntity.ok(UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .picture(user.getPictureUrl())
                .build());
    }

    /**
     * Logout endpoint — Spring Security handles session invalidation via
     * SecurityConfig.
     * This is just a fallback info endpoint.
     */
    @GetMapping("/login-url")
    public ResponseEntity<String> getLoginUrl() {
        return ResponseEntity.ok("/oauth2/authorization/google");
    }
}
