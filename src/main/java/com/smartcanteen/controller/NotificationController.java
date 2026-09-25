package com.smartcanteen.controller;

import com.smartcanteen.model.NotificationLog;
import com.smartcanteen.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(originPatterns = "*")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping("/logs")
    public ResponseEntity<List<NotificationLog>> getNotificationLogs() {
        return ResponseEntity.ok(notificationService.getAllLogs());
    }
}
