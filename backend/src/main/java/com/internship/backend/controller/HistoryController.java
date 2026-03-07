package com.internship.backend.controller;

import com.internship.backend.dto.SearchHistoryRequest;
import com.internship.backend.dto.SearchHistoryResponse;
import com.internship.backend.model.User;
import com.internship.backend.service.HistoryService;
import com.internship.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import java.util.List;

@RestController
@RequestMapping("/api/history")
@RequiredArgsConstructor
public class HistoryController {

    private final HistoryService historyService;
    private final UserService userService;

    /** GET /api/history — fetch the logged-in user's search history */
    @GetMapping
    public ResponseEntity<List<SearchHistoryResponse>> getHistory(
            @AuthenticationPrincipal OidcUser oidcUser) {

        if (oidcUser == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userService.loadOrCreateUser(oidcUser);
        return ResponseEntity.ok(historyService.getHistory(user));
    }

    /** POST /api/history — save a new search entry */
    @PostMapping
    public ResponseEntity<SearchHistoryResponse> saveHistory(
            @AuthenticationPrincipal OidcUser oidcUser,
            @RequestBody SearchHistoryRequest request) {

        if (oidcUser == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userService.loadOrCreateUser(oidcUser);
        SearchHistoryResponse saved = historyService.saveSearch(user, request);
        return ResponseEntity.ok(saved);
    }

    /** DELETE /api/history/{id} — delete a user's own history entry */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteHistory(
            @AuthenticationPrincipal OidcUser oidcUser,
            @PathVariable Long id) {

        if (oidcUser == null) {
            return ResponseEntity.status(401).build();
        }
        User user = userService.loadOrCreateUser(oidcUser);
        historyService.deleteEntry(user, id);
        return ResponseEntity.noContent().build();
    }
}
