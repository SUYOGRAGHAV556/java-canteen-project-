package com.smartcanteen.dto;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class InventoryAdjustRequest {

    @NotNull(message = "Adjustment amount is required")
    private BigDecimal amount; // positive to add stock, negative to deduct

    private String reason;

    public InventoryAdjustRequest() {}

    public InventoryAdjustRequest(BigDecimal amount, String reason) {
        this.amount = amount;
        this.reason = reason;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
