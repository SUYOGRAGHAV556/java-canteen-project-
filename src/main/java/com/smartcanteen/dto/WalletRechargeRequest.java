package com.smartcanteen.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class WalletRechargeRequest {

    @NotNull(message = "Recharge amount is required")
    @DecimalMin(value = "10.00", message = "Minimum recharge amount is 10.00")
    private BigDecimal amount;

    private String paymentReference;

    public WalletRechargeRequest() {}

    public WalletRechargeRequest(BigDecimal amount, String paymentReference) {
        this.amount = amount;
        this.paymentReference = paymentReference;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public String getPaymentReference() {
        return paymentReference;
    }

    public void setPaymentReference(String paymentReference) {
        this.paymentReference = paymentReference;
    }
}
