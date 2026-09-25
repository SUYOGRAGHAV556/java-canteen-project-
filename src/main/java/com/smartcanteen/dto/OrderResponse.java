package com.smartcanteen.dto;

import com.smartcanteen.model.Order;
import com.smartcanteen.model.OrderItem;
import com.smartcanteen.model.OrderStatus;
import com.smartcanteen.model.PaymentMethod;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public class OrderResponse {

    private Long id;
    private String orderNumber;
    private Long userId;
    private String customerName;
    private String customerPhone;
    private BigDecimal totalAmount;
    private OrderStatus status;
    private PaymentMethod paymentMethod;
    private String pickupTimeOption;
    private LocalDateTime estimatedPickupTime;
    private Integer estimatedPrepMinutes;
    private String specialInstructions;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<OrderItemResponse> items;

    public static class OrderItemResponse {
        private Long id;
        private Long menuItemId;
        private String itemName;
        private BigDecimal unitPrice;
        private Integer quantity;
        private BigDecimal subtotal;

        public OrderItemResponse() {}

        public OrderItemResponse(OrderItem item) {
            this.id = item.getId();
            this.menuItemId = item.getMenuItem() != null ? item.getMenuItem().getId() : null;
            this.itemName = item.getItemName();
            this.unitPrice = item.getUnitPrice();
            this.quantity = item.getQuantity();
            this.subtotal = item.getSubtotal();
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public Long getMenuItemId() { return menuItemId; }
        public void setMenuItemId(Long menuItemId) { this.menuItemId = menuItemId; }
        public String getItemName() { return itemName; }
        public void setItemName(String itemName) { this.itemName = itemName; }
        public BigDecimal getUnitPrice() { return unitPrice; }
        public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }
        public Integer getQuantity() { return quantity; }
        public void setQuantity(Integer quantity) { this.quantity = quantity; }
        public BigDecimal getSubtotal() { return subtotal; }
        public void setSubtotal(BigDecimal subtotal) { this.subtotal = subtotal; }
    }

    public OrderResponse() {}

    public OrderResponse(Order order) {
        this.id = order.getId();
        this.orderNumber = order.getOrderNumber();
        this.userId = order.getUser() != null ? order.getUser().getId() : null;
        this.customerName = order.getCustomerName();
        this.customerPhone = order.getCustomerPhone();
        this.totalAmount = order.getTotalAmount();
        this.status = order.getStatus();
        this.paymentMethod = order.getPaymentMethod();
        this.pickupTimeOption = order.getPickupTimeOption();
        this.estimatedPickupTime = order.getEstimatedPickupTime();
        this.estimatedPrepMinutes = order.getEstimatedPrepMinutes();
        this.specialInstructions = order.getSpecialInstructions();
        this.createdAt = order.getCreatedAt();
        this.updatedAt = order.getUpdatedAt();
        if (order.getItems() != null) {
            this.items = order.getItems().stream()
                    .map(OrderItemResponse::new)
                    .collect(Collectors.toList());
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getOrderNumber() { return orderNumber; }
    public void setOrderNumber(String orderNumber) { this.orderNumber = orderNumber; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
    public OrderStatus getStatus() { return status; }
    public void setStatus(OrderStatus status) { this.status = status; }
    public PaymentMethod getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(PaymentMethod paymentMethod) { this.paymentMethod = paymentMethod; }
    public String getPickupTimeOption() { return pickupTimeOption; }
    public void setPickupTimeOption(String pickupTimeOption) { this.pickupTimeOption = pickupTimeOption; }
    public LocalDateTime getEstimatedPickupTime() { return estimatedPickupTime; }
    public void setEstimatedPickupTime(LocalDateTime estimatedPickupTime) { this.estimatedPickupTime = estimatedPickupTime; }
    public Integer getEstimatedPrepMinutes() { return estimatedPrepMinutes; }
    public void setEstimatedPrepMinutes(Integer estimatedPrepMinutes) { this.estimatedPrepMinutes = estimatedPrepMinutes; }
    public String getSpecialInstructions() { return specialInstructions; }
    public void setSpecialInstructions(String specialInstructions) { this.specialInstructions = specialInstructions; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public List<OrderItemResponse> getItems() { return items; }
    public void setItems(List<OrderItemResponse> items) { this.items = items; }
}
