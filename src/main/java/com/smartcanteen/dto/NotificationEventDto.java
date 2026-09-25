package com.smartcanteen.dto;

import java.time.LocalDateTime;

public class NotificationEventDto {

    private String eventType; // ORDER_CREATED, ORDER_STATUS_CHANGED, MENU_TOGGLED, INVENTORY_ALERT
    private String message;
    private Object payload;
    private LocalDateTime timestamp = LocalDateTime.now();

    public NotificationEventDto() {}

    public NotificationEventDto(String eventType, String message, Object payload) {
        this.eventType = eventType;
        this.message = message;
        this.payload = payload;
        this.timestamp = LocalDateTime.now();
    }

    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public Object getPayload() { return payload; }
    public void setPayload(Object payload) { this.payload = payload; }
    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}
