package com.smartcanteen.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class InventoryCreateRequest {

    @NotBlank(message = "Ingredient name is required")
    private String ingredientName;

    @NotNull(message = "Current stock is required")
    private BigDecimal currentStock;

    @NotBlank(message = "Unit is required")
    private String unit;

    @NotNull(message = "Minimum threshold is required")
    private BigDecimal minimumThreshold;

    private BigDecimal unitCost = BigDecimal.ZERO;

    public InventoryCreateRequest() {}

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
}
