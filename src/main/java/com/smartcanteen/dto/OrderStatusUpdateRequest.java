package com.smartcanteen.dto;

import com.smartcanteen.model.OrderStatus;
import jakarta.validation.constraints.NotNull;

public class OrderStatusUpdateRequest {

    @NotNull(message = "New status is required")
    private OrderStatus status;

    private String notes;

    public OrderStatusUpdateRequest() {}

    public OrderStatusUpdateRequest(OrderStatus status, String notes) {
        this.status = status;
        this.notes = notes;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public void setStatus(OrderStatus status) {
        this.status = status;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }
}
