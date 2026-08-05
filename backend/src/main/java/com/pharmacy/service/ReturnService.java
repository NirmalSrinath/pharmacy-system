package com.pharmacy.service;

import com.pharmacy.dto.ReturnDTO;
import com.pharmacy.entity.Medicine;
import com.pharmacy.entity.Return;
import com.pharmacy.entity.Sale;
import com.pharmacy.entity.User;
import com.pharmacy.exception.BadRequestException;
import com.pharmacy.exception.ResourceNotFoundException;
import com.pharmacy.repository.MedicineRepository;
import com.pharmacy.repository.ReturnsRepository;
import com.pharmacy.repository.SalesRepository;
import com.pharmacy.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ReturnService {

    private final ReturnsRepository returnsRepository;
    private final SalesRepository salesRepository;
    private final MedicineRepository medicineRepository;
    private final UserRepository userRepository;

    public ReturnService(ReturnsRepository returnsRepository,
                         SalesRepository salesRepository,
                         MedicineRepository medicineRepository,
                         UserRepository userRepository) {
        this.returnsRepository = returnsRepository;
        this.salesRepository = salesRepository;
        this.medicineRepository = medicineRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public ReturnDTO createReturn(ReturnDTO returnDTO, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User", "username", username));

        Medicine medicine = medicineRepository.findById(returnDTO.getMedicineId())
                .orElseThrow(() -> new ResourceNotFoundException("Medicine", "id", returnDTO.getMedicineId()));

        Sale sale = null;
        if (returnDTO.getSaleId() != null) {
            sale = salesRepository.findById(returnDTO.getSaleId())
                    .orElseThrow(() -> new ResourceNotFoundException("Sale", "id", returnDTO.getSaleId()));
        }

        BigDecimal unitPrice = medicine.getSalePrice();
        BigDecimal refundAmount = unitPrice.multiply(BigDecimal.valueOf(returnDTO.getQuantity()));

        Return returnEntity = Return.builder()
                .sale(sale)
                .medicine(medicine)
                .quantity(returnDTO.getQuantity())
                .reason(returnDTO.getReason())
                .refundAmount(refundAmount)
                .returnDate(LocalDateTime.now())
                .createdBy(user)
                .build();

        returnEntity = returnsRepository.save(returnEntity);

        medicine.setStockQuantity(medicine.getStockQuantity() + returnDTO.getQuantity());
        medicineRepository.save(medicine);

        return toDTO(returnEntity);
    }

    public List<ReturnDTO> getAllReturns() {
        return returnsRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<ReturnDTO> getReturnsBySaleId(Long saleId) {
        return returnsRepository.findBySaleId(saleId).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public ReturnDTO getReturnById(Long id) {
        Return returnEntity = returnsRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Return", "id", id));
        return toDTO(returnEntity);
    }

    public ReturnDTO toDTO(Return returnEntity) {
        return ReturnDTO.builder()
                .id(returnEntity.getId())
                .medicineId(returnEntity.getMedicine().getId())
                .medicineName(returnEntity.getMedicine().getName())
                .saleId(returnEntity.getSale() != null ? returnEntity.getSale().getId() : null)
                .saleInvoiceNumber(returnEntity.getSale() != null ? returnEntity.getSale().getInvoiceNumber() : null)
                .quantity(returnEntity.getQuantity())
                .reason(returnEntity.getReason())
                .refundAmount(returnEntity.getRefundAmount())
                .returnDate(returnEntity.getReturnDate())
                .createdBy(returnEntity.getCreatedBy() != null ? returnEntity.getCreatedBy().getId() : null)
                .createdAt(returnEntity.getCreatedAt())
                .build();
    }
}
