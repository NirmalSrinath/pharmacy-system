package com.pharmacy.service;

import com.pharmacy.dto.MedicineDTO;
import com.pharmacy.entity.Medicine;
import com.pharmacy.exception.BadRequestException;
import com.pharmacy.exception.ResourceNotFoundException;
import com.pharmacy.repository.MedicineRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MedicineService {

    private final MedicineRepository medicineRepository;

    public MedicineService(MedicineRepository medicineRepository) {
        this.medicineRepository = medicineRepository;
    }

    public List<MedicineDTO> getAllMedicines() {
        return medicineRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public MedicineDTO getMedicineById(Long id) {
        Medicine medicine = medicineRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medicine", "id", id));
        return toDTO(medicine);
    }

    public MedicineDTO createMedicine(MedicineDTO dto) {
        Medicine medicine = toEntity(dto);
        medicine = medicineRepository.save(medicine);
        return toDTO(medicine);
    }

    public MedicineDTO updateMedicine(Long id, MedicineDTO dto) {
        Medicine existing = medicineRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medicine", "id", id));

        existing.setName(dto.getName());
        existing.setGenericName(dto.getGenericName());
        existing.setManufacturer(dto.getManufacturer());
        existing.setBatchNumber(dto.getBatchNumber());
        existing.setStockQuantity(dto.getStockQuantity());
        existing.setSalePrice(dto.getSalePrice());
        existing.setPurchasePrice(dto.getPurchasePrice());
        existing.setGstRate(dto.getGstRate());
        existing.setHsnCode(dto.getHsnCode());
        existing.setExpiryDate(dto.getExpiryDate());
        existing.setLowStockThreshold(dto.getLowStockThreshold());
        existing.setRackNumber(dto.getRackNumber());
        existing.setType(dto.getType());
        if (dto.getActive() != null) {
            existing.setActive(dto.getActive());
        }

        existing = medicineRepository.save(existing);
        return toDTO(existing);
    }

    public void deleteMedicine(Long id) {
        if (!medicineRepository.existsById(id)) {
            throw new ResourceNotFoundException("Medicine", "id", id);
        }
        medicineRepository.deleteById(id);
    }

    public List<MedicineDTO> searchMedicines(String name) {
        return medicineRepository.searchMedicines(name).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<MedicineDTO> getExpiryAlerts(int days) {
        LocalDate cutoff = LocalDate.now().plusDays(days);
        return medicineRepository.findExpiryAlerts(cutoff).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<MedicineDTO> getLowStockMedicines(int threshold) {
        if (threshold > 0) {
            return medicineRepository.findByStockQuantityLessThanEqual(threshold).stream()
                    .map(this::toDTO)
                    .collect(Collectors.toList());
        }
        return medicineRepository.findLowStockMedicines().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<MedicineDTO> getExpiryAlertsBetween(LocalDate startDate, LocalDate endDate) {
        return medicineRepository.findByExpiryDateBetween(startDate, endDate).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<MedicineDTO> findExactMatch(String name, String batchNumber, LocalDate expiryDate) {
        return medicineRepository.findExactMatch(name, batchNumber, expiryDate).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public void updateStock(Long medicineId, int quantityChange) {
        Medicine medicine = medicineRepository.findById(medicineId)
                .orElseThrow(() -> new ResourceNotFoundException("Medicine", "id", medicineId));

        int newStock = medicine.getStockQuantity() + quantityChange;
        if (newStock < 0) {
            throw new BadRequestException("Stock cannot be negative for medicine: " + medicine.getName());
        }
        medicine.setStockQuantity(newStock);
        medicineRepository.save(medicine);
    }

    public MedicineDTO toDTO(Medicine medicine) {
        return MedicineDTO.builder()
                .id(medicine.getId())
                .name(medicine.getName())
                .genericName(medicine.getGenericName())
                .manufacturer(medicine.getManufacturer())
                .batchNumber(medicine.getBatchNumber())
                .stockQuantity(medicine.getStockQuantity())
                .salePrice(medicine.getSalePrice())
                .purchasePrice(medicine.getPurchasePrice())
                .gstRate(medicine.getGstRate())
                .hsnCode(medicine.getHsnCode())
                .expiryDate(medicine.getExpiryDate())
                .lowStockThreshold(medicine.getLowStockThreshold())
                .rackNumber(medicine.getRackNumber())
                .type(medicine.getType())
                .active(medicine.getActive())
                .version(medicine.getVersion())
                .build();
    }

    public Medicine toEntity(MedicineDTO dto) {
        return Medicine.builder()
                .id(dto.getId())
                .name(dto.getName())
                .genericName(dto.getGenericName())
                .manufacturer(dto.getManufacturer())
                .batchNumber(dto.getBatchNumber())
                .stockQuantity(dto.getStockQuantity() != null ? dto.getStockQuantity() : 0)
                .salePrice(dto.getSalePrice())
                .purchasePrice(dto.getPurchasePrice())
                .gstRate(dto.getGstRate() != null ? dto.getGstRate() : new java.math.BigDecimal("12.00"))
                .hsnCode(dto.getHsnCode())
                .expiryDate(dto.getExpiryDate())
                .lowStockThreshold(dto.getLowStockThreshold() != null ? dto.getLowStockThreshold() : 10)
                .rackNumber(dto.getRackNumber())
                .type(dto.getType())
                .active(dto.getActive() != null ? dto.getActive() : true)
                .version(dto.getVersion() != null ? dto.getVersion() : 0L)
                .build();
    }
}
