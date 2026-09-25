package com.smartcanteen.service;

import com.smartcanteen.dto.NotificationEventDto;
import com.smartcanteen.model.NotificationLog;
import com.smartcanteen.model.Order;
import com.smartcanteen.repository.NotificationLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    private final NotificationLogRepository notificationLogRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Value("${canteen.notification.sms.enabled:true}")
    private boolean smsEnabled;

    @Value("${canteen.notification.sms.sender-id:CANTEEN-ALERTS}")
    private String senderId;

    public NotificationService(NotificationLogRepository notificationLogRepository, SimpMessagingTemplate messagingTemplate) {
        this.notificationLogRepository = notificationLogRepository;
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Trigger automated SMS and Push notification when an order is ready for pickup
     */
    @Transactional
    public NotificationLog sendOrderReadyNotification(Order order) {
        String recipientName = order.getCustomerName();
        String phone = order.getCustomerPhone();
        String orderNum = order.getOrderNumber();

        String message = String.format(
                "🔔 [%s] Hello %s, your Order %s is freshly prepared and READY for pickup at Counter 2! Token: %s",
                senderId, recipientName, orderNum, orderNum
        );

        log.info("--------------------------------------------------------------------------------");
        log.info("📲 [AUTOMATED SMS SIMULATOR] Sending SMS via Gateway:");
        log.info("To: {}", phone);
        log.info("Recipient: {}", recipientName);
        log.info("Message: {}", message);
        log.info("--------------------------------------------------------------------------------");

        NotificationLog auditLog = new NotificationLog(
                order.getId(),
                orderNum,
                phone,
                recipientName,
                message,
                "SMS",
                "SENT"
        );
        auditLog.setSentAt(LocalDateTime.now());
        NotificationLog saved = notificationLogRepository.save(auditLog);

        // Push real-time event to Admin and Student channels
        messagingTemplate.convertAndSend("/topic/notifications", new NotificationEventDto(
                "SMS_SENT",
                "Automated pickup SMS dispatched to " + recipientName + " (" + phone + ")",
                saved
        ));

        return saved;
    }

    /**
     * Broadcast generic WebSocket event
     */
    public void broadcastEvent(String destination, String eventType, String message, Object payload) {
        NotificationEventDto event = new NotificationEventDto(eventType, message, payload);
        messagingTemplate.convertAndSend(destination, event);
    }

    public List<NotificationLog> getAllLogs() {
        return notificationLogRepository.findAllByOrderBySentAtDesc();
    }
}
