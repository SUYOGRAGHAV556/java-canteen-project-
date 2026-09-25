package com.smartcanteen.dto;

import com.smartcanteen.model.PaymentMethod;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public class OrderCreateRequest {

    private Long userId;
    private String customerName;
    private String customerPhone;
    private String rfidTag;

    @NotNull(message = "Payment method is required")
    private PaymentMethod paymentMethod = PaymentMethod.WALLET_RFID;

    private String pickupTimeOption = "ASAP (10-15m)";
    private String specialInstructions;

    @NotEmpty(message = "Order must contain at least one item")
    private List<OrderItemDto> items;

    public OrderCreateRequest() {}

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getCustomerName() {
        return customerName;
    }

    public void setCustomerName(String customerName) {
        this.customerName = customerName;
    }

    public String getCustomerPhone() {
        return customerPhone;
    }

    public void setCustomerPhone(String customerPhone) {
        this.customerPhone = customerPhone;
    }

    public String getRfidTag() {
        return rfidTag;
    }

    public void setRfidTag(String rfidTag) {
        this.rfidTag = rfidTag;
    }

    public PaymentMethod getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(PaymentMethod paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getPickupTimeOption() {
        return pickupTimeOption;
    }

    public void setPickupTimeOption(String pickupTimeOption) {
        this.pickupTimeOption = pickupTimeOption;
    }

    public String getSpecialInstructions() {
        return specialInstructions;
    }

    public void setSpecialInstructions(String specialInstructions) {
        this.specialInstructions = specialInstructions;
    }

    public List<OrderItemDto> getItems() {
        return items;
    }

    public void setItems(List<OrderItemDto> items) {
        this.items = items;
    }
}
