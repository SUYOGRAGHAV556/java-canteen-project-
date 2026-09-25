package com.smartcanteen.dto;

public class AuthResponse {

    private boolean authenticated;
    private String role;
    private String username;
    private String displayName;
    private String token;
    private String message;

    public AuthResponse() {}

    public AuthResponse(boolean authenticated, String role, String username, String displayName, String token, String message) {
        this.authenticated = authenticated;
        this.role = role;
        this.username = username;
        this.displayName = displayName;
        this.token = token;
        this.message = message;
    }

    public static AuthResponse success(String role, String username, String displayName, String token) {
        return new AuthResponse(true, role, username, displayName, token, "Authentication successful");
    }

    public static AuthResponse failure(String message) {
        return new AuthResponse(false, null, null, null, null, message);
    }

    public boolean isAuthenticated() {
        return authenticated;
    }

    public void setAuthenticated(boolean authenticated) {
        this.authenticated = authenticated;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}
