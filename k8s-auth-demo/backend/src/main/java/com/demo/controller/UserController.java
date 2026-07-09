package com.demo.controller;

import com.demo.dto.MessageDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Locale;
import java.util.UUID;

@RestController
public class UserController {
    private static final Logger log = LoggerFactory.getLogger(UserController.class);

    @GetMapping("/api/greeting")
    public MessageDto greeting() {
        return new MessageDto(
            "Hello from the Spring Boot backend",
            "backend",
            Instant.now().toString()
        );
    }

    @GetMapping("/api/me")
    public UserProfile me(@AuthenticationPrincipal OidcUser user) {
        log.info("Validated authenticated user: username={}, email={}", user.getPreferredUsername(), user.getEmail());
        return new UserProfile(
            user.getPreferredUsername(),
            user.getFullName(),
            user.getEmail()
        );
    }

    @PostMapping("/api/execute")
    public ExecuteResponse execute(
        @RequestBody ExecuteRequest request,
        @AuthenticationPrincipal OidcUser user
    ) {
        String input = request.input() == null || request.input().isBlank()
            ? "anonymous user"
            : request.input().trim();

        String result = runBackendFunction(input);
        log.info(
            "Authenticated backend function triggered: username={}, email={}, input={}, result={}",
            user.getPreferredUsername(),
            user.getEmail(),
            input,
            result
        );

        return new ExecuteResponse(
            UUID.randomUUID().toString(),
            input,
            result,
            user.getPreferredUsername(),
            Instant.now().toString()
        );
    }

    private String runBackendFunction(String input) {
        String normalized = input.toUpperCase(Locale.ROOT);
        return "Backend function executed for " + normalized + " (" + input.length() + " characters)";
    }

    public record ExecuteRequest(String input) {
    }

    public record UserProfile(String username, String name, String email) {
    }

    public record ExecuteResponse(String taskId, String input, String result, String authenticatedUser, String timestamp) {
    }
}
