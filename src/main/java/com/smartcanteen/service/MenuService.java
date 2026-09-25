package com.smartcanteen.service;

import com.smartcanteen.dto.NotificationEventDto;
import com.smartcanteen.model.Category;
import com.smartcanteen.model.MenuItem;
import com.smartcanteen.repository.MenuItemRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class MenuService {

    private final MenuItemRepository menuItemRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public MenuService(MenuItemRepository menuItemRepository, SimpMessagingTemplate messagingTemplate) {
        this.menuItemRepository = menuItemRepository;
        this.messagingTemplate = messagingTemplate;
    }

    public List<MenuItem> getAllMenuItems() {
        return menuItemRepository.findAll();
    }

    public List<MenuItem> getAvailableMenuItems() {
        return menuItemRepository.findByIsAvailable(true);
    }

    public List<MenuItem> getMenuItemsByCategory(Category category) {
        return menuItemRepository.findByCategory(category);
    }

    public MenuItem getMenuItemById(Long id) {
        return menuItemRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Menu item not found with ID: " + id));
    }

    @Transactional
    public MenuItem toggleItemAvailability(Long id, boolean available) {
        MenuItem item = getMenuItemById(id);
        item.setAvailable(available);
        MenuItem saved = menuItemRepository.save(item);

        // Instant broadcast to all connected student & kitchen views!
        messagingTemplate.convertAndSend("/topic/menu-updates", new NotificationEventDto(
                "MENU_TOGGLED",
                String.format("Item '%s' marked as %s", saved.getName(), available ? "AVAILABLE" : "SOLD OUT"),
                saved
        ));

        return saved;
    }

    @Transactional
    public MenuItem saveMenuItem(MenuItem menuItem) {
        return menuItemRepository.save(menuItem);
    }
}
