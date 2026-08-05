package com.pharmacy.controller;

import com.pharmacy.dto.ApiResponse;
import com.pharmacy.entity.Backup;
import com.pharmacy.service.DatabaseBackupService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/backup")
@RequiredArgsConstructor
public class BackupController {

    private final DatabaseBackupService backupService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Backup>>> getAllBackups() {
        List<Backup> backups = backupService.getAllBackups();
        return ResponseEntity.ok(ApiResponse.success("Backups retrieved", backups));
    }

    @GetMapping("/recent")
    public ResponseEntity<ApiResponse<List<Backup>>> getRecentBackups(
            @RequestParam(defaultValue = "10") int limit) {
        List<Backup> backups = backupService.getRecentBackups(limit);
        return ResponseEntity.ok(ApiResponse.success("Recent backups retrieved", backups));
    }

    @PostMapping("/create")
    public ResponseEntity<ApiResponse<Backup>> createBackup(Authentication authentication) {
        Long userId = null;
        if (authentication != null) {
            // Extract user ID from authentication if needed
        }
        Backup backup = backupService.performBackup("MANUAL", userId);
        if ("SUCCESS".equals(backup.getStatus())) {
            return ResponseEntity.ok(ApiResponse.success("Backup created successfully", backup));
        }
        return ResponseEntity.badRequest().body(ApiResponse.error("Backup failed: " + backup.getErrorMessage()));
    }

    @GetMapping("/download/{id}")
    public ResponseEntity<byte[]> downloadBackup(@PathVariable Long id) throws IOException {
        byte[] data = backupService.downloadBackup(id);
        String filename = "backup_" + id + ".sql.gz";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .contentLength(data.length)
                .body(data);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteBackup(@PathVariable Long id) throws IOException {
        backupService.deleteBackup(id);
        return ResponseEntity.ok(ApiResponse.success("Backup deleted", null));
    }
}
