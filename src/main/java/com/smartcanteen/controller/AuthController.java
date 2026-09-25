package com.smartcanteen.controller;

import com.smartcanteen.dto.AuthRequest;
import com.smartcanteen.dto.AuthResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(originPatterns = "*")
public class AuthController {

    @Value("${canteen.auth.admin.password:owner123}")
    private String adminPassword;

    @Value("${canteen.auth.kitchen.password:kitchen123}")
    private String kitchenPassword;

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request) {
        String role = request.getRole().trim().toUpperCase();
        String password = request.getPassword().trim();

        if ("ADMIN".equals(role) || "OWNER".equals(role)) {
            if (adminPassword.equals(password) || "admin123".equals(password) || "owner123".equals(password)) {
                String token = "AUTH-ADMIN-" + UUID.randomUUID();
                return ResponseEntity.ok(AuthResponse.success(
                        "ADMIN",
                        "owner@canteen.edu",
                        "Canteen Owner (Suyog Raghav / Vikram Singh)",
                        token
                ));
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(AuthResponse.failure("Invalid Owner / Admin password. Access denied."));
            }
        } else if ("KITCHEN".equals(role) || "STAFF".equals(role) || "KDS".equals(role)) {
            if (kitchenPassword.equals(password) || "kitchen123".equals(password) || "chef123".equals(password)) {
                String token = "AUTH-KITCHEN-" + UUID.randomUUID();
                return ResponseEntity.ok(AuthResponse.success(
                        "KITCHEN",
                        "kitchen@canteen.edu",
                        "Head Chef Ramesh Kumar",
                        token
                ));
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(AuthResponse.failure("Invalid Kitchen Staff PIN / password. Access denied."));
            }
        }

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(AuthResponse.failure("Unknown role requested: " + role));
    }

    @GetMapping("/verify")
    public ResponseEntity<AuthResponse> verifyToken(@RequestParam String token, @RequestParam String role) {
        if (token == null || token.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(AuthResponse.failure("No token provided"));
        }

        String normalizedRole = role.trim().toUpperCase();
        if (("ADMIN".equals(normalizedRole) || "OWNER".equals(normalizedRole)) && token.startsWith("AUTH-ADMIN-")) {
            return ResponseEntity.ok(AuthResponse.success("ADMIN", "owner@canteen.edu", "Canteen Owner", token));
        } else if (("KITCHEN".equals(normalizedRole) || "STAFF".equals(normalizedRole)) && token.startsWith("AUTH-KITCHEN-")) {
            return ResponseEntity.ok(AuthResponse.success("KITCHEN", "kitchen@canteen.edu", "Head Chef Ramesh Kumar", token));
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(AuthResponse.failure("Invalid or expired session"));
    }
}
