package com.pharmacy.service;

import com.pharmacy.dto.SaleDTO;
import com.pharmacy.dto.SaleItemDTO;
import com.pharmacy.entity.Medicine;
import com.pharmacy.entity.Sale;
import com.pharmacy.entity.SalesItem;
import com.pharmacy.entity.User;
import com.pharmacy.exception.BadRequestException;
import com.pharmacy.exception.InsufficientStockException;
import com.pharmacy.exception.ResourceNotFoundException;
import com.pharmacy.repository.MedicineRepository;
import com.pharmacy.repository.SalesRepository;
import com.pharmacy.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.concurrent.atomic.AtomicLong;
import java.util.stream.Collectors;

@Service
public class SalesService {

    private final SalesRepository salesRepository;
    private final MedicineRepository medicineRepository;
    private final UserRepository userRepository;
    private static final AtomicLong invoiceCounter = new AtomicLong(1000);

    public SalesService(SalesRepository salesRepository,
                        MedicineRepository medicineRepository,
                        UserRepository userRepository) {
        this.salesRepository = salesRepository;
        this.medicineRepository = medicineRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public SaleDTO createSale(SaleDTO saleDTO, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        if (saleDTO.getSaleItems() == null || saleDTO.getSaleItems().isEmpty()) {
            throw new BadRequestException("Sale must contain at least one item");
        }

        String invoiceNumber = generateInvoiceNumber();

        Sale sale = Sale.builder()
                .customerName(saleDTO.getCustomerName())
                .customerPhone(saleDTO.getCustomerPhone())
                .invoiceNumber(invoiceNumber)
                .paymentMethod(saleDTO.getPaymentMethod() != null ? saleDTO.getPaymentMethod() : "CASH")
                .createdBy(user)
                .saleDate(LocalDateTime.now())
                .subtotal(BigDecimal.ZERO)
                .gstAmount(BigDecimal.ZERO)
                .discount(saleDTO.getDiscount() != null ? saleDTO.getDiscount() : BigDecimal.ZERO)
                .total(BigDecimal.ZERO)
                .build();

        sale = salesRepository.save(sale);

        BigDecimal totalSubtotal = BigDecimal.ZERO;
        BigDecimal totalGst = BigDecimal.ZERO;

        for (SaleItemDTO itemDTO : saleDTO.getSaleItems()) {
            Medicine medicine = medicineRepository.findById(itemDTO.getMedicineId())
                    .orElseThrow(() -> new ResourceNotFoundException("Medicine", "id", itemDTO.getMedicineId()));

            if (medicine.getStockQuantity() < itemDTO.getQuantity()) {
                throw new InsufficientStockException(medicine.getName(), itemDTO.getQuantity(), medicine.getStockQuantity());
            }

            BigDecimal unitPrice = itemDTO.getUnitPrice() != null ? itemDTO.getUnitPrice() : medicine.getSalePrice();
            BigDecimal gstRate = medicine.getGstRate();
            BigDecimal itemSubtotal = unitPrice.multiply(BigDecimal.valueOf(itemDTO.getQuantity()));
            BigDecimal itemGstAmount = itemSubtotal.multiply(gstRate).divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
            BigDecimal itemTotal = itemSubtotal.add(itemGstAmount);

            SalesItem salesItem = SalesItem.builder()
                    .sale(sale)
                    .medicine(medicine)
                    .quantity(itemDTO.getQuantity())
                    .unitPrice(unitPrice)
                    .gstRate(gstRate)
                    .gstAmount(itemGstAmount)
                    .total(itemTotal)
                    .build();

            sale.getSalesItems().add(salesItem);

            medicine.setStockQuantity(medicine.getStockQuantity() - itemDTO.getQuantity());
            medicineRepository.save(medicine);

            totalSubtotal = totalSubtotal.add(itemSubtotal);
            totalGst = totalGst.add(itemGstAmount);
        }

        sale.setSubtotal(totalSubtotal);
        sale.setGstAmount(totalGst);
        sale.setTotal(totalSubtotal.add(totalGst).subtract(sale.getDiscount()));

        sale = salesRepository.save(sale);
        return toDTO(sale);
    }

    public List<SaleDTO> getAllSales() {
        return salesRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public Page<SaleDTO> getAllSales(Pageable pageable) {
        return salesRepository.findAll(pageable).map(this::toDTO);
    }

    public SaleDTO getSaleById(Long id) {
        Sale sale = salesRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Sale", "id", id));
        return toDTO(sale);
    }

    public List<SaleDTO> getSalesByDateRange(LocalDate startDate, LocalDate endDate) {
        LocalDateTime start = startDate.atStartOfDay();
        LocalDateTime end = endDate.atTime(LocalTime.MAX);
        return salesRepository.findBySaleDateBetween(start, end).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<SaleDTO> getRecentSales() {
        return salesRepository.findTop10ByOrderBySaleDateDesc().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    private String generateInvoiceNumber() {
        long count = invoiceCounter.incrementAndGet();
        String datePart = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        return "INV-" + datePart + "-" + String.format("%04d", count);
    }

    public SaleDTO toDTO(Sale sale) {
        List<SaleItemDTO> itemDTOs = sale.getSalesItems().stream()
                .map(item -> SaleItemDTO.builder()
                        .id(item.getId())
                        .medicineId(item.getMedicine().getId())
                        .medicineName(item.getMedicine().getName())
                        .quantity(item.getQuantity())
                        .unitPrice(item.getUnitPrice())
                        .gstRate(item.getGstRate())
                        .gstAmount(item.getGstAmount())
                        .total(item.getTotal())
                        .rackNumber(item.getMedicine().getRackNumber())
                        .medicineType(item.getMedicine().getType())
                        .build())
                .collect(Collectors.toList());

        return SaleDTO.builder()
                .id(sale.getId())
                .customerName(sale.getCustomerName())
                .customerPhone(sale.getCustomerPhone())
                .invoiceNumber(sale.getInvoiceNumber())
                .saleItems(itemDTOs)
                .subtotal(sale.getSubtotal())
                .gstAmount(sale.getGstAmount())
                .discount(sale.getDiscount())
                .total(sale.getTotal())
                .paymentMethod(sale.getPaymentMethod())
                .createdBy(sale.getCreatedBy() != null ? sale.getCreatedBy().getId() : null)
                .createdByName(sale.getCreatedBy() != null ? sale.getCreatedBy().getFullName() : null)
                .saleDate(sale.getSaleDate())
                .createdAt(sale.getCreatedAt())
                .build();
    }
}
