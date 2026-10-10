package com.smartcanteen.controller;

import com.smartcanteen.dto.InventoryAdjustRequest;
import com.smartcanteen.dto.InventoryCreateRequest;
import com.smartcanteen.model.InventoryItem;
import com.smartcanteen.service.InventoryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/inventory")
@CrossOrigin(originPatterns = "*")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @GetMapping
    public ResponseEntity<List<InventoryItem>> getAllInventory(@RequestParam(required = false, defaultValue = "false") boolean lowStockOnly) {
        if (lowStockOnly) {
            return ResponseEntity.ok(inventoryService.getLowStockItems());
        }
        return ResponseEntity.ok(inventoryService.getAllInventory());
    }

    @PostMapping
    public ResponseEntity<InventoryItem> createIngredient(@Valid @RequestBody InventoryCreateRequest request) {
        InventoryItem created = inventoryService.createIngredient(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping("/{id}/adjust")
    public ResponseEntity<InventoryItem> adjustStock(@PathVariable Long id,
                                                     @Valid @RequestBody InventoryAdjustRequest request) {
        InventoryItem updated = inventoryService.adjustStock(id, request);
        return ResponseEntity.ok(updated);
    }

}
