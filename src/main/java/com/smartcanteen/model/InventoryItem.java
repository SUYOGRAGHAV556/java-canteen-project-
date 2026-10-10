package com.smartcanteen.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "inventory")
public class InventoryItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "ingredient_name", nullable = false, unique = true, length = 100)
    private String ingredientName;

    @Column(name = "current_stock", nullable = false, precision = 10, scale = 2)
    private BigDecimal currentStock = BigDecimal.ZERO;

    @Column(nullable = false, length = 20)
    private String unit; // kg, L, packs, pcs, buns

    @Column(name = "minimum_threshold", nullable = false, precision = 10, scale = 2)
    private BigDecimal minimumThreshold = BigDecimal.valueOf(5.0);

    @Column(name = "unit_cost", nullable = false, precision = 10, scale = 2)
    private BigDecimal unitCost = BigDecimal.ZERO;

    @Column(name = "last_restocked_at")
    private LocalDateTime lastRestockedAt = LocalDateTime.now();

    public InventoryItem() {}

    public InventoryItem(String ingredientName, BigDecimal currentStock, String unit, BigDecimal minimumThreshold, BigDecimal unitCost) {
        this.ingredientName = ingredientName;
        this.currentStock = currentStock;
        this.unit = unit;
        this.minimumThreshold = minimumThreshold;
        this.unitCost = unitCost;
        this.lastRestockedAt = LocalDateTime.now();
    }

    public boolean isLowStock() {
        return this.currentStock != null && this.minimumThreshold != null
                && this.currentStock.compareTo(this.minimumThreshold) <= 0;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getIngredientName() {
        return ingredientName;
    }

    public void setIngredientName(String ingredientName) {
        this.ingredientName = ingredientName;
    }

    public BigDecimal getCurrentStock() {
        return currentStock;
    }

    public void setCurrentStock(BigDecimal currentStock) {
        this.currentStock = currentStock;
    }

    public String getUnit() {
        return unit;
    }

    public void setUnit(String unit) {
        this.unit = unit;
    }

    public BigDecimal getMinimumThreshold() {
        return minimumThreshold;
    }

    public void setMinimumThreshold(BigDecimal minimumThreshold) {
        this.minimumThreshold = minimumThreshold;
    }

    public BigDecimal getUnitCost() {
        return unitCost;
    }

    public void setUnitCost(BigDecimal unitCost) {
        this.unitCost = unitCost;
    }

    public LocalDateTime getLastRestockedAt() {
        return lastRestockedAt;
    }

    public void setLastRestockedAt(LocalDateTime lastRestockedAt) {
        this.lastRestockedAt = lastRestockedAt;
    }

}
