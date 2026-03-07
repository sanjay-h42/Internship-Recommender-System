package com.internship.backend.service;

import com.internship.backend.model.User;
import com.internship.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    /**
     * Finds an existing user by Google ID, or creates one from the OidcUser profile.
     */
    public User loadOrCreateUser(OidcUser oidcUser) {
        String googleId = oidcUser.getSubject();
        return userRepository.findByGoogleId(googleId)
                .orElseGet(() -> {
                    User newUser = User.builder()
                            .googleId(googleId)
                            .name(oidcUser.getFullName())
                            .email(oidcUser.getEmail())
                            .pictureUrl(oidcUser.getPicture())
                            .build();
                    return userRepository.save(newUser);
                });
    }

    public User findById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found: " + id));
    }
}
