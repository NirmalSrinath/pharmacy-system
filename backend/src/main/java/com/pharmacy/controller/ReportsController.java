package com.pharmacy.controller;

import com.pharmacy.dto.ApiResponse;
import com.pharmacy.dto.ReportDTO;
import com.pharmacy.service.ReportService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/reports")
public class ReportsController {

    private final ReportService reportService;

    public ReportsController(ReportService reportService) {
        this.reportService = reportService;
    }

    @GetMapping("/daily")
    public ResponseEntity<ApiResponse<ReportDTO>> getDailyReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        ReportDTO report = reportService.getDailyReport(date);
        return ResponseEntity.ok(ApiResponse.success(report));
    }

    @GetMapping("/weekly")
    public ResponseEntity<ApiResponse<ReportDTO>> getWeeklyReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate) {
        ReportDTO report = reportService.getWeeklyReport(startDate);
        return ResponseEntity.ok(ApiResponse.success(report));
    }

    @GetMapping("/monthly")
    public ResponseEntity<ApiResponse<ReportDTO>> getMonthlyReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        ReportDTO report = reportService.getMonthlyReport(date);
        return ResponseEntity.ok(ApiResponse.success(report));
    }

    @GetMapping("/yearly")
    public ResponseEntity<ApiResponse<ReportDTO>> getYearlyReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        ReportDTO report = reportService.getYearlyReport(date);
        return ResponseEntity.ok(ApiResponse.success(report));
    }
}
