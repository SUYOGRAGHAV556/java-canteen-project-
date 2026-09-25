package com.smartcanteen.controller;

import com.smartcanteen.dto.WalletBalanceResponse;
import com.smartcanteen.dto.WalletRechargeRequest;
import com.smartcanteen.model.Wallet;
import com.smartcanteen.service.WalletService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/wallet")
@CrossOrigin(originPatterns = "*")
public class WalletController {

    private final WalletService walletService;

    public WalletController(WalletService walletService) {
        this.walletService = walletService;
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<WalletBalanceResponse> getWalletByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(walletService.getWalletBalance(userId));
    }

    @GetMapping("/rfid/{rfidTag}")
    public ResponseEntity<WalletBalanceResponse> getWalletByRfid(@PathVariable String rfidTag) {
        Wallet wallet = walletService.getWalletByRfidTag(rfidTag);
        return ResponseEntity.ok(new WalletBalanceResponse(
                wallet.getUser().getId(),
                wallet.getUser().getName(),
                wallet.getUser().getRfidTag(),
                wallet.getBalance(),
                wallet.getCurrency(),
                wallet.getLastRechargeDate()
        ));
    }

    @PostMapping("/user/{userId}/recharge")
    public ResponseEntity<WalletBalanceResponse> rechargeWallet(@PathVariable Long userId,
                                                               @Valid @RequestBody WalletRechargeRequest request) {
        Wallet updated = walletService.rechargeWallet(userId, request.getAmount());
        return ResponseEntity.ok(new WalletBalanceResponse(
                updated.getUser().getId(),
                updated.getUser().getName(),
                updated.getUser().getRfidTag(),
                updated.getBalance(),
                updated.getCurrency(),
                updated.getLastRechargeDate()
        ));
    }
}
