package com.smartcanteen.repository;

import com.smartcanteen.model.NotificationLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationLogRepository extends JpaRepository<NotificationLog, Long> {
    List<NotificationLog> findAllByOrderBySentAtDesc();
    List<NotificationLog> findByOrderIdOrderBySentAtDesc(Long orderId);
}
