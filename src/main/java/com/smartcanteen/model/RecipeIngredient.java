package com.smartcanteen.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(
        name = "menu_item_ingredients",
        uniqueConstraints = @UniqueConstraint(columnNames = {"menu_item_id", "inventory_id"})
)
public class RecipeIngredient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "menu_item_id", nullable = false)
    private MenuItem menuItem;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inventory_id", nullable = false)
    private InventoryItem inventoryItem;

    @Column(name = "quantity_used", nullable = false, precision = 10, scale = 2)
    private BigDecimal quantityUsed;

    public RecipeIngredient() {}

    public RecipeIngredient(MenuItem menuItem, InventoryItem inventoryItem, BigDecimal quantityUsed) {
        this.menuItem = menuItem;
        this.inventoryItem = inventoryItem;
        this.quantityUsed = quantityUsed;
    }

    public Long getId() {
        return id;
    }

    public MenuItem getMenuItem() {
        return menuItem;
    }

    public InventoryItem getInventoryItem() {
        return inventoryItem;
    }

    public BigDecimal getQuantityUsed() {
        return quantityUsed;
    }
}
