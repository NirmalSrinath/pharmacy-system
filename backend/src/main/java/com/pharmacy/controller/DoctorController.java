package com.pharmacy.controller;

import com.pharmacy.dto.ApiResponse;
import com.pharmacy.dto.DoctorDTO;
import com.pharmacy.dto.VerifyRequest;
import com.pharmacy.service.DoctorService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/doctors")
public class DoctorController {

    private final DoctorService doctorService;

    public DoctorController(DoctorService doctorService) {
        this.doctorService = doctorService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<DoctorDTO>>> getAllDoctors() {
        List<DoctorDTO> doctors = doctorService.getAllDoctors();
        return ResponseEntity.ok(ApiResponse.success(doctors));
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<DoctorDTO>>> getActiveDoctors() {
        List<DoctorDTO> doctors = doctorService.getActiveDoctors();
        return ResponseEntity.ok(ApiResponse.success(doctors));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DoctorDTO>> getDoctorById(@PathVariable Long id) {
        DoctorDTO doctor = doctorService.getDoctorById(id);
        return ResponseEntity.ok(ApiResponse.success(doctor));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<DoctorDTO>>> searchDoctors(@RequestParam String name) {
        List<DoctorDTO> doctors = doctorService.searchDoctors(name);
        return ResponseEntity.ok(ApiResponse.success(doctors));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<DoctorDTO>> createDoctor(@Valid @RequestBody DoctorDTO doctorDTO) {
        DoctorDTO created = doctorService.createDoctor(doctorDTO);
        return ResponseEntity.ok(ApiResponse.success("Doctor created successfully", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<DoctorDTO>> updateDoctor(@PathVariable Long id,
                                                                @Valid @RequestBody DoctorDTO doctorDTO) {
        DoctorDTO updated = doctorService.updateDoctor(id, doctorDTO);
        return ResponseEntity.ok(ApiResponse.success("Doctor updated successfully", updated));
    }

    @PutMapping("/{id}/toggle")
    public ResponseEntity<ApiResponse<Void>> toggleDoctor(@PathVariable Long id) {
        doctorService.toggleDoctor(id);
        return ResponseEntity.ok(ApiResponse.success("Doctor status toggled", null));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteDoctor(@PathVariable Long id) {
        doctorService.deleteDoctor(id);
        return ResponseEntity.ok(ApiResponse.success("Doctor deleted successfully", null));
    }

    @PostMapping("/verify")
    public ResponseEntity<ApiResponse<Boolean>> verifyDoctor(@RequestBody VerifyRequest request) {
        boolean valid = doctorService.verifyPasscode(request);
        if (valid) {
            return ResponseEntity.ok(ApiResponse.success("Doctor verified", true));
        }
        return ResponseEntity.ok(ApiResponse.error("Invalid passcode"));
    }
}
