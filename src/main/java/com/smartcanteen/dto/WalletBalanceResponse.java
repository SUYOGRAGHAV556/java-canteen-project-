package com.smartcanteen.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class WalletBalanceResponse {

    private Long userId;
    private String userName;
    private String rfidTag;
    private BigDecimal balance;
    private String currency;
    private LocalDateTime lastRechargeDate;

    public WalletBalanceResponse() {}

    public WalletBalanceResponse(Long userId, String userName, String rfidTag, BigDecimal balance, String currency, LocalDateTime lastRechargeDate) {
        this.userId = userId;
        this.userName = userName;
        this.rfidTag = rfidTag;
        this.balance = balance;
        this.currency = currency;
        this.lastRechargeDate = lastRechargeDate;
    }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }
    public String getRfidTag() { return rfidTag; }
    public void setRfidTag(String rfidTag) { this.rfidTag = rfidTag; }
    public BigDecimal getBalance() { return balance; }
    public void setBalance(BigDecimal balance) { this.balance = balance; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public LocalDateTime getLastRechargeDate() { return lastRechargeDate; }
    public void setLastRechargeDate(LocalDateTime lastRechargeDate) { this.lastRechargeDate = lastRechargeDate; }
}
