package com.smartcanteen.service;

import com.smartcanteen.dto.InventoryAdjustRequest;
import com.smartcanteen.dto.InventoryCreateRequest;
import com.smartcanteen.dto.NotificationEventDto;
import com.smartcanteen.model.InventoryItem;
import com.smartcanteen.repository.InventoryItemRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class InventoryService {

    private final InventoryItemRepository inventoryItemRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public InventoryService(InventoryItemRepository inventoryItemRepository, SimpMessagingTemplate messagingTemplate) {
        this.inventoryItemRepository = inventoryItemRepository;
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
        BigDecimal newStock = item.getCurrentStock().add(request.getAmount());
        if (newStock.compareTo(BigDecimal.ZERO) < 0) {
            newStock = BigDecimal.ZERO;
        }
        item.setCurrentStock(newStock);
        item.setLastRestockedAt(LocalDateTime.now());
        InventoryItem saved = inventoryItemRepository.save(item);

        // Check if low stock condition triggered
        if (saved.isLowStock()) {
            messagingTemplate.convertAndSend("/topic/inventory-alerts", new NotificationEventDto(
                    "LOW_STOCK_WARNING",
                    String.format("⚠️ Low stock warning: '%s' has only %s %s remaining (Threshold: %s)",
                            saved.getIngredientName(), saved.getCurrentStock(), saved.getUnit(), saved.getMinimumThreshold()),
                    saved
            ));
        }

        return saved;
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
}
