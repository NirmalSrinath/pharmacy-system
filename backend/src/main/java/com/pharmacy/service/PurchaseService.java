package com.pharmacy.service;

import com.pharmacy.dto.PurchaseDTO;
import com.pharmacy.entity.Medicine;
import com.pharmacy.entity.Purchase;
import com.pharmacy.entity.User;
import com.pharmacy.exception.ResourceNotFoundException;
import com.pharmacy.repository.MedicineRepository;
import com.pharmacy.repository.PurchaseRepository;
import com.pharmacy.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class PurchaseService {

    private final PurchaseRepository purchaseRepository;
    private final MedicineRepository medicineRepository;
    private final UserRepository userRepository;

    public PurchaseService(PurchaseRepository purchaseRepository,
                           MedicineRepository medicineRepository,
                           UserRepository userRepository) {
        this.purchaseRepository = purchaseRepository;
        this.medicineRepository = medicineRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public PurchaseDTO createPurchase(PurchaseDTO purchaseDTO, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        Medicine medicine;
        if (purchaseDTO.getMedicineId() != null) {
            medicine = medicineRepository.findById(purchaseDTO.getMedicineId())
                    .orElseThrow(() -> new ResourceNotFoundException("Medicine", "id", purchaseDTO.getMedicineId()));
        } else {
            medicine = Medicine.builder()
                    .name(purchaseDTO.getMedicineName())
                    .genericName(purchaseDTO.getGenericName())
                    .batchNumber(purchaseDTO.getBatchNumber())
                    .purchasePrice(purchaseDTO.getUnitPrice())
                    .salePrice(purchaseDTO.getUnitPrice().multiply(new BigDecimal("1.10")).setScale(2, RoundingMode.HALF_UP))
                    .stockQuantity(0)
                    .gstRate(purchaseDTO.getGstRate() != null ? purchaseDTO.getGstRate() : new BigDecimal("18.00"))
                    .expiryDate(LocalDate.now().plusYears(1))
                    .lowStockThreshold(10)
                    .rackNumber(purchaseDTO.getRackNumber())
                    .type(purchaseDTO.getMedicineType())
                    .build();
            medicine = medicineRepository.save(medicine);
        }

        if (purchaseDTO.getRackNumber() != null && !purchaseDTO.getRackNumber().isBlank()) {
            medicine.setRackNumber(purchaseDTO.getRackNumber());
        }
        if (purchaseDTO.getMedicineType() != null && !purchaseDTO.getMedicineType().isBlank()) {
            medicine.setType(purchaseDTO.getMedicineType());
        }

        BigDecimal unitPrice = purchaseDTO.getUnitPrice();
        BigDecimal gstRate = purchaseDTO.getGstRate() != null ? purchaseDTO.getGstRate() : medicine.getGstRate();
        BigDecimal itemSubtotal = unitPrice.multiply(BigDecimal.valueOf(purchaseDTO.getQuantity()));
        BigDecimal gstAmount = itemSubtotal.multiply(gstRate).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
        BigDecimal total = itemSubtotal.add(gstAmount);

        Purchase purchase = Purchase.builder()
                .medicine(medicine)
                .quantity(purchaseDTO.getQuantity())
                .unitPrice(unitPrice)
                .gstRate(gstRate)
                .gstAmount(gstAmount)
                .total(total)
                .supplierName(purchaseDTO.getSupplierName())
                .invoiceNumber(purchaseDTO.getInvoiceNumber())
                .purchaseDate(LocalDateTime.now())
                .createdBy(user)
                .build();

        purchase = purchaseRepository.save(purchase);

        medicine.setStockQuantity(medicine.getStockQuantity() + purchaseDTO.getQuantity());
        if (purchaseDTO.getRackNumber() != null && !purchaseDTO.getRackNumber().isBlank()) {
            medicine.setRackNumber(purchaseDTO.getRackNumber());
        }
        if (purchaseDTO.getMedicineType() != null && !purchaseDTO.getMedicineType().isBlank()) {
            medicine.setType(purchaseDTO.getMedicineType());
        }
        medicineRepository.save(medicine);

        return toDTO(purchase);
    }

    public List<PurchaseDTO> getAllPurchases() {
        return purchaseRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<PurchaseDTO> getPurchasesByDateRange(LocalDate startDate, LocalDate endDate) {
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(LocalTime.MAX);
        return purchaseRepository.findByPurchaseDateBetween(start, end).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public PurchaseDTO getPurchaseById(Long id) {
        Purchase purchase = purchaseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase", "id", id));
        return toDTO(purchase);
    }

    public PurchaseDTO toDTO(Purchase purchase) {
        return PurchaseDTO.builder()
                .id(purchase.getId())
                .medicineId(purchase.getMedicine().getId())
                .medicineName(purchase.getMedicine().getName())
                .genericName(purchase.getMedicine().getGenericName())
                .batchNumber(purchase.getMedicine().getBatchNumber())
                .rackNumber(purchase.getMedicine().getRackNumber())
                .medicineType(purchase.getMedicine().getType())
                .quantity(purchase.getQuantity())
                .unitPrice(purchase.getUnitPrice())
                .gstRate(purchase.getGstRate())
                .gstAmount(purchase.getGstAmount())
                .total(purchase.getTotal())
                .supplierName(purchase.getSupplierName())
                .invoiceNumber(purchase.getInvoiceNumber())
                .purchaseDate(purchase.getPurchaseDate())
                .createdBy(purchase.getCreatedBy() != null ? purchase.getCreatedBy().getId() : null)
                .createdAt(purchase.getCreatedAt())
                .version(purchase.getVersion())
                .build();
    }
}
