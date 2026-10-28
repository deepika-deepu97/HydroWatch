package com.waterleak.identity.controller;

import com.waterleak.identity.dto.AuthRequest;
import com.waterleak.identity.dto.AuthResponse;
import com.waterleak.identity.dto.UserProfileDto;
import com.waterleak.identity.service.AuthService;
import com.waterleak.identity.service.JwtService;
import io.jsonwebtoken.Claims;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;
    private final JwtService jwtService;

    public AuthController(AuthService authService, JwtService jwtService) {
        this.authService = authService;
        this.jwtService = jwtService;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest request) {
        return ResponseEntity.ok(authService.authenticate(request));
    }

    @GetMapping("/me")
    public ResponseEntity<UserProfileDto> getMe(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        Claims claims = jwtService.extractClaims(token);

        UserProfileDto profile = new UserProfileDto(
                claims.get("userId", String.class),
                claims.getSubject(),
                "",
                claims.get("fullName", String.class),
                claims.get("role", String.class),
                claims.get("properties", String.class)
        );
        return ResponseEntity.ok(profile);
    }
}
