package com.smartcanteen.repository;

import com.smartcanteen.model.InventoryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryItemRepository extends JpaRepository<InventoryItem, Long> {
    Optional<InventoryItem> findByIngredientNameIgnoreCase(String ingredientName);

    @Query("SELECT i FROM InventoryItem i WHERE i.currentStock <= i.minimumThreshold ORDER BY i.currentStock ASC")
    List<InventoryItem> findLowStockItems();

    @Query("SELECT COUNT(i) FROM InventoryItem i WHERE i.currentStock <= i.minimumThreshold")
    long countLowStockItems();
}
