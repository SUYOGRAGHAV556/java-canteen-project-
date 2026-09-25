package com.smartcanteen.service;

import com.smartcanteen.dto.WalletBalanceResponse;
import com.smartcanteen.model.User;
import com.smartcanteen.model.Wallet;
import com.smartcanteen.repository.UserRepository;
import com.smartcanteen.repository.WalletRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
public class WalletService {

    private final WalletRepository walletRepository;
    private final UserRepository userRepository;

    public WalletService(WalletRepository walletRepository, UserRepository userRepository) {
        this.walletRepository = walletRepository;
        this.userRepository = userRepository;
    }

    public Wallet getWalletByUserId(Long userId) {
        return walletRepository.findByUserId(userId)
                .orElseGet(() -> {
                    User user = userRepository.findById(userId)
                            .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));
                    Wallet newWallet = new Wallet(user, BigDecimal.valueOf(100.00));
                    return walletRepository.save(newWallet);
                });
    }

    public Wallet getWalletByRfidTag(String rfidTag) {
        return walletRepository.findByUserRfidTag(rfidTag)
                .orElseThrow(() -> new IllegalArgumentException("No wallet associated with RFID tag: " + rfidTag));
    }

    public WalletBalanceResponse getWalletBalance(Long userId) {
        Wallet wallet = getWalletByUserId(userId);
        return new WalletBalanceResponse(
                wallet.getUser().getId(),
                wallet.getUser().getName(),
                wallet.getUser().getRfidTag(),
                wallet.getBalance(),
                wallet.getCurrency(),
                wallet.getLastRechargeDate()
        );
    }

    @Transactional
    public void deductBalance(Long userId, BigDecimal amount) {
        Wallet wallet = getWalletByUserId(userId);
        if (wallet.getBalance().compareTo(amount) < 0) {
            throw new IllegalStateException(String.format(
                    "Insufficient wallet balance! Required: ₹%.2f, Available: ₹%.2f. Please recharge via UPI/RFID.",
                    amount, wallet.getBalance()
            ));
        }
        wallet.setBalance(wallet.getBalance().subtract(amount));
        wallet.setUpdatedAt(LocalDateTime.now());
        walletRepository.save(wallet);
    }

    @Transactional
    public Wallet rechargeWallet(Long userId, BigDecimal amount) {
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Recharge amount must be greater than zero");
        }
        Wallet wallet = getWalletByUserId(userId);
        wallet.setBalance(wallet.getBalance().add(amount));
        wallet.setLastRechargeDate(LocalDateTime.now());
        wallet.setUpdatedAt(LocalDateTime.now());
        return walletRepository.save(wallet);
    }
}
