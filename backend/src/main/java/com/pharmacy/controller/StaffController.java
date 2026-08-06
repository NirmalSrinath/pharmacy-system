package com.pharmacy.controller;

import com.pharmacy.dto.ApiResponse;
import com.pharmacy.dto.StaffDTO;
import com.pharmacy.dto.VerifyRequest;
import com.pharmacy.service.StaffService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/staff")
public class StaffController {

    private final StaffService staffService;

    public StaffController(StaffService staffService) {
        this.staffService = staffService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<StaffDTO>>> getAllStaff() {
        List<StaffDTO> staff = staffService.getAllStaff();
        return ResponseEntity.ok(ApiResponse.success(staff));
    }

    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<StaffDTO>>> getActiveStaff() {
        List<StaffDTO> staff = staffService.getActiveStaff();
        return ResponseEntity.ok(ApiResponse.success(staff));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<StaffDTO>> getStaffById(@PathVariable Long id) {
        StaffDTO staff = staffService.getStaffById(id);
        return ResponseEntity.ok(ApiResponse.success(staff));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<StaffDTO>>> searchStaff(@RequestParam String name) {
        List<StaffDTO> staff = staffService.searchStaff(name);
        return ResponseEntity.ok(ApiResponse.success(staff));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<StaffDTO>> createStaff(@Valid @RequestBody StaffDTO staffDTO) {
        StaffDTO created = staffService.createStaff(staffDTO);
        return ResponseEntity.ok(ApiResponse.success("Staff created successfully", created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<StaffDTO>> updateStaff(@PathVariable Long id,
                                                              @Valid @RequestBody StaffDTO staffDTO) {
        StaffDTO updated = staffService.updateStaff(id, staffDTO);
        return ResponseEntity.ok(ApiResponse.success("Staff updated successfully", updated));
    }

    @PutMapping("/{id}/toggle")
    public ResponseEntity<ApiResponse<Void>> toggleStaff(@PathVariable Long id) {
        staffService.toggleStaff(id);
        return ResponseEntity.ok(ApiResponse.success("Staff status toggled", null));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteStaff(@PathVariable Long id) {
        staffService.deleteStaff(id);
        return ResponseEntity.ok(ApiResponse.success("Staff deleted successfully", null));
    }

    @PostMapping("/verify")
    public ResponseEntity<ApiResponse<Boolean>> verifyStaff(@RequestBody VerifyRequest request) {
        boolean valid = staffService.verifyPasscode(request);
        if (valid) {
            return ResponseEntity.ok(ApiResponse.success("Staff verified", true));
        }
        return ResponseEntity.ok(ApiResponse.error("Invalid passcode"));
    }
}
