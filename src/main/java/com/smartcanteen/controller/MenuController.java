package com.smartcanteen.controller;

import com.smartcanteen.dto.MenuItemToggleRequest;
import com.smartcanteen.model.Category;
import com.smartcanteen.model.MenuItem;
import com.smartcanteen.service.MenuService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/menu")
@CrossOrigin(originPatterns = "*")
public class MenuController {

    private final MenuService menuService;

    public MenuController(MenuService menuService) {
        this.menuService = menuService;
    }

    @GetMapping
    public ResponseEntity<List<MenuItem>> getMenuItems(@RequestParam(required = false) Category category,
                                                        @RequestParam(required = false, defaultValue = "false") boolean availableOnly) {
        if (category != null) {
            return ResponseEntity.ok(menuService.getMenuItemsByCategory(category));
        }
        if (availableOnly) {
            return ResponseEntity.ok(menuService.getAvailableMenuItems());
        }
        return ResponseEntity.ok(menuService.getAllMenuItems());
    }

    @GetMapping("/{id}")
    public ResponseEntity<MenuItem> getMenuItemById(@PathVariable Long id) {
        return ResponseEntity.ok(menuService.getMenuItemById(id));
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<MenuItem> toggleAvailability(@PathVariable Long id,
                                                        @Valid @RequestBody MenuItemToggleRequest request) {
        MenuItem updated = menuService.toggleItemAvailability(id, request.getAvailable());
        return ResponseEntity.ok(updated);
    }
}
