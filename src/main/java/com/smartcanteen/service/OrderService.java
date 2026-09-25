package com.smartcanteen.service;

import com.smartcanteen.dto.NotificationEventDto;
import com.smartcanteen.dto.OrderCreateRequest;
import com.smartcanteen.dto.OrderItemDto;
import com.smartcanteen.dto.OrderResponse;
import com.smartcanteen.model.*;
import com.smartcanteen.repository.MenuItemRepository;
import com.smartcanteen.repository.OrderRepository;
import com.smartcanteen.repository.UserRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Service
public class OrderService {

    private final OrderRepository orderRepository;
    private final MenuItemRepository menuItemRepository;
    private final UserRepository userRepository;
    private final WalletService walletService;
    private final NotificationService notificationService;
    private final SimpMessagingTemplate messagingTemplate;

    public OrderService(OrderRepository orderRepository,
                        MenuItemRepository menuItemRepository,
                        UserRepository userRepository,
                        WalletService walletService,
                        NotificationService notificationService,
                        SimpMessagingTemplate messagingTemplate) {
        this.orderRepository = orderRepository;
        this.menuItemRepository = menuItemRepository;
        this.userRepository = userRepository;
        this.walletService = walletService;
        this.notificationService = notificationService;
        this.messagingTemplate = messagingTemplate;
    }

    public List<OrderResponse> getAllOrders() {
        return orderRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(OrderResponse::new)
                .collect(Collectors.toList());
    }

    public List<OrderResponse> getActiveOrdersForKds() {
        List<OrderStatus> activeStatuses = List.of(OrderStatus.NEW, OrderStatus.PREPARING, OrderStatus.READY);
        return orderRepository.findByStatusInOrderByCreatedAtDesc(activeStatuses).stream()
                .map(OrderResponse::new)
                .collect(Collectors.toList());
    }

    public OrderResponse getOrderByOrderNumber(String orderNumber) {
        Order order = orderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new IllegalArgumentException("Order not found with number: " + orderNumber));
        return new OrderResponse(order);
    }

    public OrderResponse getOrderById(Long id) {
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Order not found with ID: " + id));
        return new OrderResponse(order);
    }

    @Transactional
    public OrderResponse createOrder(OrderCreateRequest request) {
        User user = null;
        if (request.getUserId() != null) {
            user = userRepository.findById(request.getUserId()).orElse(null);
        } else if (request.getRfidTag() != null && !request.getRfidTag().isBlank()) {
            user = userRepository.findByRfidTag(request.getRfidTag()).orElse(null);
        }

        String customerName = request.getCustomerName();
        if ((customerName == null || customerName.isBlank()) && user != null) {
            customerName = user.getName();
        } else if (customerName == null || customerName.isBlank()) {
            customerName = "Student Guest";
        }

        String customerPhone = request.getCustomerPhone();
        if ((customerPhone == null || customerPhone.isBlank()) && user != null) {
            customerPhone = user.getPhone();
        } else if (customerPhone == null || customerPhone.isBlank()) {
            customerPhone = "+1 (555) 000-1234";
        }

        Order order = new Order();
        order.setOrderNumber(generateOrderNumber());
        order.setUser(user);
        order.setCustomerName(customerName);
        order.setCustomerPhone(customerPhone);
        order.setPaymentMethod(request.getPaymentMethod());
        order.setPickupTimeOption(request.getPickupTimeOption() != null ? request.getPickupTimeOption() : "ASAP (10-15m)");
        order.setSpecialInstructions(request.getSpecialInstructions());
        order.setStatus(OrderStatus.NEW);
        order.setCreatedAt(LocalDateTime.now());
        order.setUpdatedAt(LocalDateTime.now());

        BigDecimal total = BigDecimal.ZERO;
        int maxPrepTime = 5; // minimum base prep time

        for (OrderItemDto itemDto : request.getItems()) {
            MenuItem menuItem = menuItemRepository.findById(itemDto.getMenuItemId())
                    .orElseThrow(() -> new IllegalArgumentException("Menu item not found: " + itemDto.getMenuItemId()));

            if (!menuItem.isAvailable()) {
                throw new IllegalStateException("Item '" + menuItem.getName() + "' is currently SOLD OUT!");
            }

            BigDecimal unitPrice = menuItem.getPrice();
            BigDecimal subtotal = unitPrice.multiply(BigDecimal.valueOf(itemDto.getQuantity()));
            total = total.add(subtotal);

            if (menuItem.getPrepTimeMinutes() != null && menuItem.getPrepTimeMinutes() > maxPrepTime) {
                maxPrepTime = menuItem.getPrepTimeMinutes();
            }

            OrderItem orderItem = new OrderItem(
                    menuItem,
                    menuItem.getName(),
                    unitPrice,
                    itemDto.getQuantity(),
                    subtotal
            );
            order.addItem(orderItem);
        }

        order.setTotalAmount(total);
        order.setEstimatedPrepMinutes(maxPrepTime);
        order.setEstimatedPickupTime(LocalDateTime.now().plusMinutes(maxPrepTime));

        // Deduct from Wallet if PaymentMethod is WALLET_RFID
        if (request.getPaymentMethod() == PaymentMethod.WALLET_RFID) {
            Long userIdToDeduct = user != null ? user.getId() : 1L; // fallback to default student if demo
            walletService.deductBalance(userIdToDeduct, total);
        }

        Order saved = orderRepository.save(order);
        OrderResponse response = new OrderResponse(saved);

        // Real-Time Broadcast to Kitchen Display System & Admin
        messagingTemplate.convertAndSend("/topic/orders", new NotificationEventDto(
                "ORDER_CREATED",
                "New order received: " + saved.getOrderNumber() + " for " + saved.getCustomerName(),
                response
        ));

        return response;
    }

    @Transactional
    public OrderResponse updateOrderStatus(Long orderId, OrderStatus newStatus, String notes) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new IllegalArgumentException("Order not found with ID: " + orderId));

        OrderStatus previousStatus = order.getStatus();
        order.setStatus(newStatus);
        order.setUpdatedAt(LocalDateTime.now());
        Order saved = orderRepository.save(order);

        // Automated SMS/Push Notification Trigger when order moves to READY!
        if (newStatus == OrderStatus.READY && previousStatus != OrderStatus.READY) {
            notificationService.sendOrderReadyNotification(saved);
        }

        OrderResponse response = new OrderResponse(saved);

        // Broadcast to KDS board & Admin
        messagingTemplate.convertAndSend("/topic/orders", new NotificationEventDto(
                "ORDER_STATUS_CHANGED",
                "Order " + saved.getOrderNumber() + " updated to " + newStatus,
                response
        ));

        // Direct topic for student order tracking page
        messagingTemplate.convertAndSend("/topic/order/" + saved.getOrderNumber(), response);

        return response;
    }

    private synchronized String generateOrderNumber() {
        int randomNum = 100 + new Random().nextInt(900);
        return "ORD-" + randomNum;
    }
}
