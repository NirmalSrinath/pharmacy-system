package com.pharmacy.controller;

import com.pharmacy.dto.ApiResponse;
import com.pharmacy.dto.MedicineDTO;
import com.pharmacy.service.MedicineService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/medicines")
public class MedicineController {

    private final MedicineService medicineService;

    public MedicineController(MedicineService medicineService) {
        this.medicineService = medicineService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<MedicineDTO>>> getAllMedicines() {
        List<MedicineDTO> medicines = medicineService.getAllMedicines();
        return ResponseEntity.ok(ApiResponse.success(medicines));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<MedicineDTO>> getMedicineById(@PathVariable Long id) {
        MedicineDTO medicine = medicineService.getMedicineById(id);
        return ResponseEntity.ok(ApiResponse.success(medicine));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<MedicineDTO>> createMedicine(@Valid @RequestBody MedicineDTO medicineDTO) {
        MedicineDTO created = medicineService.createMedicine(medicineDTO);
        return ResponseEntity.ok(ApiResponse.success("Medicine created successfully", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<MedicineDTO>> updateMedicine(@PathVariable Long id,
                                                                    @Valid @RequestBody MedicineDTO medicineDTO) {
        MedicineDTO updated = medicineService.updateMedicine(id, medicineDTO);
        return ResponseEntity.ok(ApiResponse.success("Medicine updated successfully", updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteMedicine(@PathVariable Long id) {
        medicineService.deleteMedicine(id);
        return ResponseEntity.ok(ApiResponse.success("Medicine deleted successfully", null));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<MedicineDTO>>> searchMedicines(@RequestParam String name) {
        List<MedicineDTO> medicines = medicineService.searchMedicines(name);
        return ResponseEntity.ok(ApiResponse.success(medicines));
    }

    @GetMapping("/expiry-alerts")
    public ResponseEntity<ApiResponse<List<MedicineDTO>>> getExpiryAlerts(
            @RequestParam(required = false, defaultValue = "30") Integer days) {
        List<MedicineDTO> medicines = medicineService.getExpiryAlerts(days);
        return ResponseEntity.ok(ApiResponse.success(medicines));
    }

    @GetMapping("/low-stock")
    public ResponseEntity<ApiResponse<List<MedicineDTO>>> getLowStockMedicines(
            @RequestParam(required = false, defaultValue = "0") Integer threshold) {
        List<MedicineDTO> medicines = medicineService.getLowStockMedicines(threshold);
        return ResponseEntity.ok(ApiResponse.success(medicines));
    }
}
