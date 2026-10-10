package com.smartcanteen.service;

import com.smartcanteen.dto.InventoryAdjustRequest;
import com.smartcanteen.dto.InventoryCreateRequest;
import com.smartcanteen.dto.NotificationEventDto;
import com.smartcanteen.model.InventoryItem;
import com.smartcanteen.model.OrderItem;
import com.smartcanteen.model.RecipeIngredient;
import com.smartcanteen.repository.InventoryItemRepository;
import com.smartcanteen.repository.RecipeIngredientRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class InventoryService {

    private final InventoryItemRepository inventoryItemRepository;
    private final RecipeIngredientRepository recipeIngredientRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public InventoryService(InventoryItemRepository inventoryItemRepository,
                            RecipeIngredientRepository recipeIngredientRepository,
                            SimpMessagingTemplate messagingTemplate) {
        this.inventoryItemRepository = inventoryItemRepository;
        this.recipeIngredientRepository = recipeIngredientRepository;
        this.messagingTemplate = messagingTemplate;
    }

    public List<InventoryItem> getAllInventory() {
        return inventoryItemRepository.findAll();
    }

    public List<InventoryItem> getLowStockItems() {
        return inventoryItemRepository.findLowStockItems();
    }

    public long getLowStockCount() {
        return inventoryItemRepository.countLowStockItems();
    }

    public InventoryItem getById(Long id) {
        return inventoryItemRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Inventory item not found with ID: " + id));
    }

    @Transactional
    public InventoryItem adjustStock(Long id, InventoryAdjustRequest request) {
        InventoryItem item = getById(id);
        BigDecimal previousStock = item.getCurrentStock();
        BigDecimal newStock = previousStock.add(request.getAmount());
        if (newStock.compareTo(BigDecimal.ZERO) < 0) {
            newStock = BigDecimal.ZERO;
        }
        item.setCurrentStock(newStock);
        item.setLastRestockedAt(LocalDateTime.now());
        InventoryItem saved = inventoryItemRepository.save(item);
        publishLowStockAlertOnThresholdCrossing(previousStock, saved);

        return saved;
    }

    @Transactional
    public void consumeForOrder(List<OrderItem> orderItems) {
        Set<Long> menuItemIds = orderItems.stream()
                .map(item -> item.getMenuItem().getId())
                .collect(Collectors.toSet());
        List<RecipeIngredient> recipeIngredients = recipeIngredientRepository.findByMenuItemIds(menuItemIds);
        Map<Long, List<RecipeIngredient>> recipesByMenuItem = recipeIngredients.stream()
                .collect(Collectors.groupingBy(recipe -> recipe.getMenuItem().getId()));

        Map<Long, BigDecimal> requiredByInventoryId = new HashMap<>();
        for (OrderItem orderItem : orderItems) {
            Long menuItemId = orderItem.getMenuItem().getId();
            List<RecipeIngredient> recipe = recipesByMenuItem.get(menuItemId);
            if (recipe == null || recipe.isEmpty()) {
                throw new IllegalStateException("No ingredient recipe configured for menu item: " + orderItem.getItemName());
            }

            for (RecipeIngredient ingredient : recipe) {
                Long inventoryId = ingredient.getInventoryItem().getId();
                BigDecimal required = ingredient.getQuantityUsed()
                        .multiply(BigDecimal.valueOf(orderItem.getQuantity()));
                requiredByInventoryId.merge(inventoryId, required, BigDecimal::add);
            }
        }

        List<Long> inventoryIds = new ArrayList<>(requiredByInventoryId.keySet());
        inventoryIds.sort(Long::compareTo);
        List<InventoryItem> inventoryItems = inventoryItemRepository.findAllByIdForUpdate(inventoryIds);
        Map<Long, InventoryItem> inventoryById = inventoryItems.stream()
                .collect(Collectors.toMap(InventoryItem::getId, item -> item));

        for (Map.Entry<Long, BigDecimal> entry : requiredByInventoryId.entrySet()) {
            InventoryItem item = inventoryById.get(entry.getKey());
            if (item == null) {
                throw new IllegalStateException("Recipe references missing inventory item: " + entry.getKey());
            }
            if (item.getCurrentStock().compareTo(entry.getValue()) < 0) {
                throw new IllegalStateException(String.format(
                        "Insufficient stock for %s: need %s %s, but only %s %s is available",
                        item.getIngredientName(), entry.getValue(), item.getUnit(),
                        item.getCurrentStock(), item.getUnit()));
            }
        }

        Map<Long, BigDecimal> previousStockById = new HashMap<>();
        for (Map.Entry<Long, BigDecimal> entry : requiredByInventoryId.entrySet()) {
            InventoryItem item = inventoryById.get(entry.getKey());
            previousStockById.put(item.getId(), item.getCurrentStock());
            item.setCurrentStock(item.getCurrentStock().subtract(entry.getValue()));
        }

        List<InventoryItem> savedItems = inventoryItemRepository.saveAll(inventoryItems);
        for (InventoryItem item : savedItems) {
            publishLowStockAlertOnThresholdCrossing(previousStockById.get(item.getId()), item);
        }
    }

    @Transactional
    public InventoryItem createIngredient(InventoryCreateRequest request) {
        InventoryItem item = new InventoryItem(
                request.getIngredientName(),
                request.getCurrentStock(),
                request.getUnit(),
                request.getMinimumThreshold(),
                request.getUnitCost()
        );
        return inventoryItemRepository.save(item);
    }

    private void publishLowStockAlertOnThresholdCrossing(BigDecimal previousStock, InventoryItem item) {
        boolean wasLowStock = previousStock.compareTo(item.getMinimumThreshold()) <= 0;
        if (!wasLowStock && item.isLowStock()) {
            messagingTemplate.convertAndSend("/topic/inventory-alerts", new NotificationEventDto(
                    "LOW_STOCK_WARNING",
                    String.format("Low stock warning: '%s' has only %s %s remaining (Threshold: %s)",
                            item.getIngredientName(), item.getCurrentStock(), item.getUnit(), item.getMinimumThreshold()),
                    item
            ));
        }
    }
}
