package com.smartcanteen.repository;

import com.smartcanteen.model.InventoryItem;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryItemRepository extends JpaRepository<InventoryItem, Long> {
    Optional<InventoryItem> findByIngredientNameIgnoreCase(String ingredientName);

    @Query("SELECT i FROM InventoryItem i WHERE i.currentStock <= i.minimumThreshold ORDER BY i.currentStock ASC")
    List<InventoryItem> findLowStockItems();

    @Query("SELECT COUNT(i) FROM InventoryItem i WHERE i.currentStock <= i.minimumThreshold")
    long countLowStockItems();

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i FROM InventoryItem i WHERE i.id IN :ids ORDER BY i.id")
    List<InventoryItem> findAllByIdForUpdate(@Param("ids") Collection<Long> ids);
}
