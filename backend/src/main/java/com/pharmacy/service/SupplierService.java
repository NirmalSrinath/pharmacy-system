package com.pharmacy.service;

import com.pharmacy.dto.SupplierDTO;
import com.pharmacy.entity.Supplier;
import com.pharmacy.exception.ResourceNotFoundException;
import com.pharmacy.repository.SupplierRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class SupplierService {

    private final SupplierRepository supplierRepository;

    public SupplierService(SupplierRepository supplierRepository) {
        this.supplierRepository = supplierRepository;
    }

    public List<SupplierDTO> getAllSuppliers() {
        return supplierRepository.findAll().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public List<SupplierDTO> getActiveSuppliers() {
        return supplierRepository.findByActiveTrue().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    public SupplierDTO getSupplierById(Long id) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier", "id", id));
        return toDTO(supplier);
    }

    public List<SupplierDTO> searchSuppliers(String name) {
        return supplierRepository.findByCompanyNameContainingIgnoreCase(name).stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public SupplierDTO createSupplier(SupplierDTO dto) {
        Supplier supplier = Supplier.builder()
                .companyName(dto.getCompanyName())
                .contactPerson(dto.getContactPerson())
                .phone(dto.getPhone())
                .email(dto.getEmail())
                .gstin(dto.getGstin())
                .drugLicenseNumber(dto.getDrugLicenseNumber())
                .address(dto.getAddress())
                .state(dto.getState())
                .pincode(dto.getPincode())
                .panNumber(dto.getPanNumber())
                .bankName(dto.getBankName())
                .bankAccountNumber(dto.getBankAccountNumber())
                .bankIfsc(dto.getBankIfsc())
                .active(true)
                .build();
        supplier = supplierRepository.save(supplier);
        return toDTO(supplier);
    }

    @Transactional
    public SupplierDTO updateSupplier(Long id, SupplierDTO dto) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier", "id", id));
        supplier.setCompanyName(dto.getCompanyName());
        supplier.setContactPerson(dto.getContactPerson());
        supplier.setPhone(dto.getPhone());
        supplier.setEmail(dto.getEmail());
        supplier.setGstin(dto.getGstin());
        supplier.setDrugLicenseNumber(dto.getDrugLicenseNumber());
        supplier.setAddress(dto.getAddress());
        supplier.setState(dto.getState());
        supplier.setPincode(dto.getPincode());
        supplier.setPanNumber(dto.getPanNumber());
        supplier.setBankName(dto.getBankName());
        supplier.setBankAccountNumber(dto.getBankAccountNumber());
        supplier.setBankIfsc(dto.getBankIfsc());
        if (dto.getActive() != null) {
            supplier.setActive(dto.getActive());
        }
        supplier = supplierRepository.save(supplier);
        return toDTO(supplier);
    }

    @Transactional
    public void toggleSupplier(Long id) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier", "id", id));
        supplier.setActive(!supplier.getActive());
        supplierRepository.save(supplier);
    }

    @Transactional
    public void deleteSupplier(Long id) {
        Supplier supplier = supplierRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier", "id", id));
        supplierRepository.delete(supplier);
    }

    private SupplierDTO toDTO(Supplier supplier) {
        return SupplierDTO.builder()
                .id(supplier.getId())
                .companyName(supplier.getCompanyName())
                .contactPerson(supplier.getContactPerson())
                .phone(supplier.getPhone())
                .email(supplier.getEmail())
                .gstin(supplier.getGstin())
                .drugLicenseNumber(supplier.getDrugLicenseNumber())
                .address(supplier.getAddress())
                .state(supplier.getState())
                .pincode(supplier.getPincode())
                .panNumber(supplier.getPanNumber())
                .bankName(supplier.getBankName())
                .bankAccountNumber(supplier.getBankAccountNumber())
                .bankIfsc(supplier.getBankIfsc())
                .active(supplier.getActive())
                .createdAt(supplier.getCreatedAt())
                .build();
    }
}
