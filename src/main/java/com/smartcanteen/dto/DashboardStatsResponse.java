package com.smartcanteen.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public class DashboardStatsResponse {

    private BigDecimal todayRevenue;
    private long totalOrdersToday;
    private long activeOrdersCount;
    private long lowStockCount;
    private double avgPrepTimeMinutes;

    private List<TopItemStat> topSellingItems;
    private Map<String, Long> hourlyOrderDistribution;
    private Map<String, BigDecimal> categoryRevenueDistribution;

    public static class TopItemStat {
        private String name;
        private long quantity;
        private BigDecimal revenue;

        public TopItemStat() {}

        public TopItemStat(String name, long quantity, BigDecimal revenue) {
            this.name = name;
            this.quantity = quantity;
            this.revenue = revenue;
        }

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public long getQuantity() { return quantity; }
        public void setQuantity(long quantity) { this.quantity = quantity; }
        public BigDecimal getRevenue() { return revenue; }
        public void setRevenue(BigDecimal revenue) { this.revenue = revenue; }
    }

    public DashboardStatsResponse() {}

    public BigDecimal getTodayRevenue() {
        return todayRevenue;
    }

    public void setTodayRevenue(BigDecimal todayRevenue) {
        this.todayRevenue = todayRevenue;
    }

    public long getTotalOrdersToday() {
        return totalOrdersToday;
    }

    public void setTotalOrdersToday(long totalOrdersToday) {
        this.totalOrdersToday = totalOrdersToday;
    }

    public long getActiveOrdersCount() {
        return activeOrdersCount;
    }

    public void setActiveOrdersCount(long activeOrdersCount) {
        this.activeOrdersCount = activeOrdersCount;
    }

    public long getLowStockCount() {
        return lowStockCount;
    }

    public void setLowStockCount(long lowStockCount) {
        this.lowStockCount = lowStockCount;
    }

    public double getAvgPrepTimeMinutes() {
        return avgPrepTimeMinutes;
    }

    public void setAvgPrepTimeMinutes(double avgPrepTimeMinutes) {
        this.avgPrepTimeMinutes = avgPrepTimeMinutes;
    }

    public List<TopItemStat> getTopSellingItems() {
        return topSellingItems;
    }

    public void setTopSellingItems(List<TopItemStat> topSellingItems) {
        this.topSellingItems = topSellingItems;
    }

    public Map<String, Long> getHourlyOrderDistribution() {
        return hourlyOrderDistribution;
    }

    public void setHourlyOrderDistribution(Map<String, Long> hourlyOrderDistribution) {
        this.hourlyOrderDistribution = hourlyOrderDistribution;
    }

    public Map<String, BigDecimal> getCategoryRevenueDistribution() {
        return categoryRevenueDistribution;
    }

    public void setCategoryRevenueDistribution(Map<String, BigDecimal> categoryRevenueDistribution) {
        this.categoryRevenueDistribution = categoryRevenueDistribution;
    }
}
