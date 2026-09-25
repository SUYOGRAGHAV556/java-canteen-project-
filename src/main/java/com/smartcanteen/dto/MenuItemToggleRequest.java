package com.smartcanteen.dto;

import jakarta.validation.constraints.NotNull;

public class MenuItemToggleRequest {

    @NotNull(message = "Availability status is required")
    private Boolean available;

    public MenuItemToggleRequest() {}

    public MenuItemToggleRequest(Boolean available) {
        this.available = available;
    }

    public Boolean getAvailable() {
        return available;
    }

    public void setAvailable(Boolean available) {
        this.available = available;
    }
}
