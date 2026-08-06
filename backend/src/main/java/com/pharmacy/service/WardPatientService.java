package com.pharmacy.service;

import com.pharmacy.dto.WardPatientDTO;
import com.pharmacy.dto.WardPatientItemDTO;
import com.pharmacy.entity.*;
import com.pharmacy.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class WardPatientService {

    private final WardPatientRepository wardPatientRepository;
    private final MedicineRepository medicineRepository;
    private final SalesRepository salesRepository;
    private final SalesService salesService;
    private final UserRepository userRepository;

    public WardPatientService(WardPatientRepository wardPatientRepository,
                              MedicineRepository medicineRepository,
                              SalesRepository salesRepository,
                              SalesService salesService,
                              UserRepository userRepository) {
        this.wardPatientRepository = wardPatientRepository;
        this.medicineRepository = medicineRepository;
        this.salesRepository = salesRepository;
        this.salesService = salesService;
        this.userRepository = userRepository;
    }

    public List<WardPatientDTO> getAll() {
        return wardPatientRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<WardPatientDTO> getByStatus(String status) {
        return wardPatientRepository.findByStatusOrderByCreatedAtDesc(status).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<WardPatientDTO> getByDateRange(LocalDate startDate, LocalDate endDate) {
        return wardPatientRepository.findByAdmitDateBetweenOrderByCreatedAtDesc(startDate, endDate).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<WardPatientDTO> search(String keyword) {
        return wardPatientRepository.searchByKeyword(keyword).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public WardPatientDTO getById(Long id) {
        WardPatient wp = wardPatientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ward patient not found with id: " + id));
        return toDTO(wp);
    }

    @Transactional
    public WardPatientDTO create(WardPatientDTO dto, String username) {
        User user = userRepository.findByUsername(username).orElse(null);

        WardPatient wp = WardPatient.builder()
                .patientName(dto.getPatientName())
                .patientPhone(dto.getPatientPhone())
                .doctorName(dto.getDoctorName())
                .wardNumber(dto.getWardNumber())
                .bedNumber(dto.getBedNumber())
                .admitDate(dto.getAdmitDate() != null ? dto.getAdmitDate() : LocalDate.now())
                .status("ADMITTED")
                .paymentMethod(dto.getPaymentMethod() != null ? dto.getPaymentMethod() : "CASH")
                .createdBy(user)
                .build();

        wp = wardPatientRepository.save(wp);

        if (dto.getItems() != null && !dto.getItems().isEmpty()) {
            for (WardPatientItemDTO itemDTO : dto.getItems()) {
                addItemToPatient(wp.getId(), itemDTO);
            }
            recalculateTotals(wp.getId());
            wp = wardPatientRepository.findById(wp.getId()).orElse(wp);
        }

        return toDTO(wp);
    }

    @Transactional
    public WardPatientDTO update(Long id, WardPatientDTO dto) {
        WardPatient wp = wardPatientRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Ward patient not found with id: " + id));

        wp.setPatientName(dto.getPatientName());
        wp.setPatientPhone(dto.getPatientPhone());
        wp.setDoctorName(dto.getDoctorName());
        wp.setWardNumber(dto.getWardNumber());
        wp.setBedNumber(dto.getBedNumber());
        if (dto.getAdmitDate() != null) wp.setAdmitDate(dto.getAdmitDate());
        if (dto.getDischargeDate() != null) wp.setDischargeDate(dto.getDischargeDate());
        if (dto.getPaymentMethod() != null) wp.setPaymentMethod(dto.getPaymentMethod());
        if (dto.getDiscount() != null) wp.setDiscount(dto.getDiscount());

        wardPatientRepository.save(wp);
        return recalculateTotals(id);
    }

    @Transactional
    public WardPatientItemDTO addItemToPatient(Long wardPatientId, WardPatientItemDTO itemDTO) {
        WardPatient wp = wardPatientRepository.findById(wardPatientId)
                .orElseThrow(() -> new RuntimeException("Ward patient not found with id: " + wardPatientId));

        Medicine medicine = medicineRepository.findById(itemDTO.getMedicineId())
                .orElseThrow(() -> new RuntimeException("Medicine not found with id: " + itemDTO.getMedicineId()));

        BigDecimal gstRate = itemDTO.getGstRate() != null ? itemDTO.getGstRate() : BigDecimal.valueOf(18);
        BigDecimal unitPrice = itemDTO.getUnitPrice() != null ? itemDTO.getUnitPrice() : BigDecimal.ZERO;
        int quantity = itemDTO.getQuantity() != null ? itemDTO.getQuantity() : 1;

        BigDecimal subtotal = unitPrice.multiply(BigDecimal.valueOf(quantity));
        BigDecimal gstAmount = subtotal.multiply(gstRate).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal total = subtotal.add(gstAmount);

        WardPatientItem item = WardPatientItem.builder()
                .wardPatient(wp)
                .medicine(medicine)
                .medicineName(medicine.getName())
                .quantity(quantity)
                .unitPrice(unitPrice)
                .gstRate(gstRate)
                .gstAmount(gstAmount)
                .total(total)
                .status("PENDING")
                .build();

        wp.getItems().add(item);
        wardPatientRepository.save(wp);

        recalculateTotals(wardPatientId);

        return toItemDTO(item);
    }

    @Transactional
    public void removeItem(Long wardPatientId, Long itemId) {
        WardPatient wp = wardPatientRepository.findById(wardPatientId)
                .orElseThrow(() -> new RuntimeException("Ward patient not found"));

        wp.getItems().removeIf(item -> item.getId().equals(itemId));
        wardPatientRepository.save(wp);
        recalculateTotals(wardPatientId);
    }

    @Transactional
    public WardPatientDTO recalculateTotals(Long wardPatientId) {
        WardPatient wp = wardPatientRepository.findById(wardPatientId)
                .orElseThrow(() -> new RuntimeException("Ward patient not found"));

        BigDecimal totalAmount = BigDecimal.ZERO;
        BigDecimal gstAmount = BigDecimal.ZERO;

        for (WardPatientItem item : wp.getItems()) {
            totalAmount = totalAmount.add(item.getTotal().subtract(item.getGstAmount()));
            gstAmount = gstAmount.add(item.getGstAmount());
        }

        BigDecimal grandTotal = totalAmount.add(gstAmount).subtract(wp.getDiscount() != null ? wp.getDiscount() : BigDecimal.ZERO);
        if (grandTotal.compareTo(BigDecimal.ZERO) < 0) grandTotal = BigDecimal.ZERO;

        wp.setTotalAmount(totalAmount);
        wp.setGstAmount(gstAmount);
        wp.setGrandTotal(grandTotal);

        wardPatientRepository.save(wp);
        return toDTO(wp);
    }

    @Transactional
    public WardPatientDTO updateDiscount(Long wardPatientId, BigDecimal discount) {
        WardPatient wp = wardPatientRepository.findById(wardPatientId)
                .orElseThrow(() -> new RuntimeException("Ward patient not found"));

        wp.setDiscount(discount != null ? discount : BigDecimal.ZERO);
        wardPatientRepository.save(wp);
        return recalculateTotals(wardPatientId);
    }

    @Transactional
    public WardPatientDTO finalizeBill(Long wardPatientId, String username) {
        WardPatient wp = wardPatientRepository.findById(wardPatientId)
                .orElseThrow(() -> new RuntimeException("Ward patient not found"));

        if ("FINALIZED".equals(wp.getStatus())) {
            throw new RuntimeException("Bill is already finalized");
        }

        User user = userRepository.findByUsername(username).orElse(null);

        String invoiceNumber = salesService.generateInvoiceNumber();

        Sale sale = Sale.builder()
                .customerName(wp.getPatientName())
                .customerPhone(wp.getPatientPhone())
                .invoiceNumber(invoiceNumber)
                .subtotal(wp.getTotalAmount())
                .gstAmount(wp.getGstAmount())
                .discount(wp.getDiscount())
                .total(wp.getGrandTotal())
                .doctorName(wp.getDoctorName())
                .staffName("Ward Patient")
                .paymentMethod(wp.getPaymentMethod() != null ? wp.getPaymentMethod() : "CASH")
                .createdBy(user)
                .saleDate(LocalDateTime.now())
                .build();

        for (WardPatientItem item : wp.getItems()) {
            SalesItem salesItem = SalesItem.builder()
                    .sale(sale)
                    .medicine(item.getMedicine())
                    .quantity(item.getQuantity())
                    .unitPrice(item.getUnitPrice())
                    .gstRate(item.getGstRate())
                    .gstAmount(item.getGstAmount())
                    .total(item.getTotal())
                    .build();
            sale.getSalesItems().add(salesItem);
        }

        sale = salesRepository.save(sale);

        wp.setSale(sale);
        wp.setDischargeDate(LocalDate.now());
        wp.setStatus("FINALIZED");

        for (WardPatientItem item : wp.getItems()) {
            item.setStatus("CONVERTED");
        }

        wardPatientRepository.save(wp);

        return toDTO(wp);
    }

    @Transactional
    public void delete(Long id) {
        wardPatientRepository.deleteById(id);
    }

    private WardPatientDTO toDTO(WardPatient wp) {
        List<WardPatientItemDTO> itemDTOs = wp.getItems().stream()
                .map(this::toItemDTO)
                .collect(Collectors.toList());

        return WardPatientDTO.builder()
                .id(wp.getId())
                .patientName(wp.getPatientName())
                .patientPhone(wp.getPatientPhone())
                .doctorName(wp.getDoctorName())
                .wardNumber(wp.getWardNumber())
                .bedNumber(wp.getBedNumber())
                .admitDate(wp.getAdmitDate())
                .dischargeDate(wp.getDischargeDate())
                .status(wp.getStatus())
                .totalAmount(wp.getTotalAmount())
                .gstAmount(wp.getGstAmount())
                .discount(wp.getDiscount())
                .grandTotal(wp.getGrandTotal())
                .paymentMethod(wp.getPaymentMethod())
                .saleId(wp.getSale() != null ? wp.getSale().getId() : null)
                .createdBy(wp.getCreatedBy() != null ? wp.getCreatedBy().getUsername() : null)
                .items(itemDTOs)
                .createdAt(wp.getCreatedAt() != null ? wp.getCreatedAt().toString() : null)
                .build();
    }

    private WardPatientItemDTO toItemDTO(WardPatientItem item) {
        return WardPatientItemDTO.builder()
                .id(item.getId())
                .wardPatientId(item.getWardPatient().getId())
                .medicineId(item.getMedicine().getId())
                .medicineName(item.getMedicineName())
                .quantity(item.getQuantity())
                .unitPrice(item.getUnitPrice())
                .gstRate(item.getGstRate())
                .gstAmount(item.getGstAmount())
                .total(item.getTotal())
                .status(item.getStatus())
                .addedAt(item.getAddedAt() != null ? item.getAddedAt().toString() : null)
                .build();
    }
}
