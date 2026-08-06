package com.pharmacy.controller;

import com.pharmacy.dto.ApiResponse;
import com.pharmacy.dto.WardPatientDTO;
import com.pharmacy.dto.WardPatientItemDTO;
import com.pharmacy.service.WardPatientService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/ward-patients")
public class WardPatientController {

    private final WardPatientService wardPatientService;

    public WardPatientController(WardPatientService wardPatientService) {
        this.wardPatientService = wardPatientService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<WardPatientDTO>>> getAll(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        List<WardPatientDTO> patients;
        if (search != null && !search.trim().isEmpty()) {
            patients = wardPatientService.search(search.trim());
        } else if (status != null && !status.trim().isEmpty()) {
            patients = wardPatientService.getByStatus(status);
        } else if (startDate != null && endDate != null) {
            patients = wardPatientService.getByDateRange(startDate, endDate);
        } else {
            patients = wardPatientService.getAll();
        }
        return ResponseEntity.ok(ApiResponse.success(patients));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<WardPatientDTO>> getById(@PathVariable Long id) {
        WardPatientDTO patient = wardPatientService.getById(id);
        return ResponseEntity.ok(ApiResponse.success(patient));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<WardPatientDTO>> create(
            @RequestBody WardPatientDTO dto,
            Authentication authentication) {
        WardPatientDTO created = wardPatientService.create(dto, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Patient admitted successfully", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<WardPatientDTO>> update(
            @PathVariable Long id,
            @RequestBody WardPatientDTO dto) {
        WardPatientDTO updated = wardPatientService.update(id, dto);
        return ResponseEntity.ok(ApiResponse.success("Patient updated successfully", updated));
    }

    @PostMapping("/{id}/items")
    public ResponseEntity<ApiResponse<WardPatientItemDTO>> addItem(
            @PathVariable Long id,
            @RequestBody WardPatientItemDTO itemDTO) {
        WardPatientItemDTO added = wardPatientService.addItemToPatient(id, itemDTO);
        return ResponseEntity.ok(ApiResponse.success("Medicine added successfully", added));
    }

    @DeleteMapping("/{id}/items/{itemId}")
    public ResponseEntity<ApiResponse<Void>> removeItem(
            @PathVariable Long id,
            @PathVariable Long itemId) {
        wardPatientService.removeItem(id, itemId);
        return ResponseEntity.ok(ApiResponse.success("Medicine removed successfully", null));
    }

    @PutMapping("/{id}/discount")
    public ResponseEntity<ApiResponse<WardPatientDTO>> updateDiscount(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, Object> body) {
        BigDecimal discount = new BigDecimal(body.get("discount").toString());
        WardPatientDTO updated = wardPatientService.updateDiscount(id, discount);
        return ResponseEntity.ok(ApiResponse.success("Discount updated", updated));
    }

    @PostMapping("/{id}/finalize")
    public ResponseEntity<ApiResponse<WardPatientDTO>> finalizeBill(
            @PathVariable Long id,
            Authentication authentication) {
        WardPatientDTO finalized = wardPatientService.finalizeBill(id, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Bill finalized and sale created successfully", finalized));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        wardPatientService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Ward patient deleted successfully", null));
    }
}
