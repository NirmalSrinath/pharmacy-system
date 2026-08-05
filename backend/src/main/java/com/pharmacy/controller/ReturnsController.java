package com.pharmacy.controller;

import com.pharmacy.dto.ApiResponse;
import com.pharmacy.dto.ReturnDTO;
import com.pharmacy.service.ReturnService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/returns")
public class ReturnsController {

    private final ReturnService returnService;

    public ReturnsController(ReturnService returnService) {
        this.returnService = returnService;
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ReturnDTO>> createReturn(@Valid @RequestBody ReturnDTO returnDTO,
                                                                Authentication authentication) {
        ReturnDTO created = returnService.createReturn(returnDTO, authentication.getName());
        return ResponseEntity.ok(ApiResponse.success("Return processed successfully", created));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ReturnDTO>>> getAllReturns() {
        List<ReturnDTO> returns = returnService.getAllReturns();
        return ResponseEntity.ok(ApiResponse.success(returns));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ReturnDTO>> getReturnById(@PathVariable Long id) {
        ReturnDTO returnDTO = returnService.getReturnById(id);
        return ResponseEntity.ok(ApiResponse.success(returnDTO));
    }

    @GetMapping("/sale/{saleId}")
    public ResponseEntity<ApiResponse<List<ReturnDTO>>> getReturnsBySaleId(@PathVariable Long saleId) {
        List<ReturnDTO> returns = returnService.getReturnsBySaleId(saleId);
        return ResponseEntity.ok(ApiResponse.success(returns));
    }
}
