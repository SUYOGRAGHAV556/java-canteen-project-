package com.smartcanteen.repository;

import com.smartcanteen.model.Order;
import com.smartcanteen.model.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    Optional<Order> findByOrderNumber(String orderNumber);
    List<Order> findByStatusInOrderByCreatedAtDesc(List<OrderStatus> statuses);
    List<Order> findByStatusOrderByCreatedAtDesc(OrderStatus status);
    List<Order> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Order> findAllByOrderByCreatedAtDesc();

    @Query("SELECT o FROM Order o WHERE o.createdAt >= :since ORDER BY o.createdAt DESC")
    List<Order> findOrdersSince(LocalDateTime since);

    @Query("SELECT COUNT(o) FROM Order o WHERE o.status IN (:statuses)")
    long countByStatusIn(List<OrderStatus> statuses);
}
