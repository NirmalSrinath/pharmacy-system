package com.pharmacy.service;

import com.pharmacy.config.BackupConfig;
import com.pharmacy.entity.Backup;
import com.pharmacy.repository.BackupRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.zip.GZIPOutputStream;

@Service
@RequiredArgsConstructor
@Slf4j
public class DatabaseBackupService {

    private final BackupConfig backupConfig;
    private final BackupRepository backupRepository;
    private final EmailService emailService;
    private final OneDriveService oneDriveService;

    private static final String DB_URL = "jdbc:mysql://localhost:3306/pharmacy_db";
    private static final String DB_USER = "root";
    private static final String DB_PASSWORD = "root";

    @Scheduled(cron = "${backup.schedule-cron:0 0 2 * * *}")
    public void scheduledBackup() {
        if (!backupConfig.isEnabled()) {
            return;
        }
        log.info("Starting scheduled database backup...");
        performBackup("SCHEDULED", null);
    }

    public Backup performBackup(String backupType, Long userId) {
        Backup backup = Backup.builder()
                .backupType(backupType)
                .status("IN_PROGRESS")
                .createdBy(userId)
                .build();

        try {
            // Ensure backup directory exists
            Path backupDir = Paths.get(backupConfig.getLocalPath());
            Files.createDirectories(backupDir);

            // Generate filename
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
            String filename = "pharmacy_backup_" + timestamp + ".sql";
            String filepath = backupDir.resolve(filename).toString();

            // Execute mysqldump
            executeMysqldump(filepath);

            // Get file size
            File backupFile = new File(filepath);
            backup.setFilename(filename);
            backup.setFilepath(filepath);
            backup.setFileSize(backupFile.length());

            // Compress if enabled
            if (backupConfig.isCompress()) {
                String compressedPath = filepath + ".gz";
                compressFile(filepath, compressedPath);
                backup.setFilename(filename + ".gz");
                backup.setFilepath(compressedPath);
                backup.setFileSize(new File(compressedPath).length());
            }

            backup.setStatus("SUCCESS");
            backup = backupRepository.save(backup);

            // Send email if enabled
            if (backupConfig.getEmail().isEnabled()) {
                try {
                    emailService.sendBackupEmail(backup);
                    backup.setEmailSent(true);
                    backupRepository.save(backup);
                } catch (Exception e) {
                    log.error("Failed to send backup email", e);
                }
            }

            // Upload to OneDrive if enabled
            if (backupConfig.getOnedrive().isEnabled()) {
                try {
                    oneDriveService.uploadBackup(backup);
                   // backup.setOneDriveUploaded(true);
                    backupRepository.save(backup);
                } catch (Exception e) {
                    log.error("Failed to upload backup to OneDrive", e);
                }
            }

            // Cleanup old backups
            cleanupOldBackups();

            log.info("Database backup completed successfully: {}", backup.getFilename());
            return backup;

        } catch (Exception e) {
            log.error("Database backup failed", e);
            backup.setStatus("FAILED");
            backup.setErrorMessage(e.getMessage());
            return backupRepository.save(backup);
        }
    }

    private void executeMysqldump(String filepath) throws IOException, InterruptedException {
        String mysqldumpPath = backupConfig.getMysqldumpPath();

        ProcessBuilder processBuilder = new ProcessBuilder(
                mysqldumpPath,
                "--host=localhost",
                "--port=3306",
                "--user=" + DB_USER,
                "--password=" + DB_PASSWORD,
                "--single-transaction",
                "--routines",
                "--triggers",
                "--databases", "pharmacy_db",
                "--result-file=" + filepath
        );

        processBuilder.redirectErrorStream(true);
        Process process = processBuilder.start();

        // Read output
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                log.debug("mysqldump: {}", line);
            }
        }

        int exitCode = process.waitFor();
        if (exitCode != 0) {
            throw new RuntimeException("mysqldump failed with exit code: " + exitCode);
        }
    }

    private void compressFile(String inputPath, String outputPath) throws IOException {
        try (FileInputStream fis = new FileInputStream(inputPath);
             FileOutputStream fos = new FileOutputStream(outputPath);
             GZIPOutputStream gzos = new GZIPOutputStream(fos)) {

            byte[] buffer = new byte[1024];
            int len;
            while ((len = fis.read(buffer)) > 0) {
                gzos.write(buffer, 0, len);
            }
        }

        // Delete original uncompressed file
        Files.deleteIfExists(Paths.get(inputPath));
    }

    private void cleanupOldBackups() {
        try {
            Path backupDir = Paths.get(backupConfig.getLocalPath());
            if (!Files.exists(backupDir)) return;

            long cutoff = System.currentTimeMillis() - (backupConfig.getRetentionDays() * 24L * 60 * 60 * 1000);

            Files.list(backupDir)
                    .filter(path -> {
                        try {
                            return Files.getLastModifiedTime(path).toMillis() < cutoff;
                        } catch (IOException e) {
                            return false;
                        }
                    })
                    .forEach(path -> {
                        try {
                            Files.delete(path);
                            log.info("Deleted old backup: {}", path.getFileName());
                        } catch (IOException e) {
                            log.error("Failed to delete old backup: {}", path, e);
                        }
                    });
        } catch (IOException e) {
            log.error("Failed to cleanup old backups", e);
        }
    }

    public List<Backup> getAllBackups() {
        return backupRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<Backup> getRecentBackups(int limit) {
        return backupRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .limit(limit)
                .toList();
    }

    public byte[] downloadBackup(Long backupId) throws IOException {
        Backup backup = backupRepository.findById(backupId)
                .orElseThrow(() -> new RuntimeException("Backup not found"));

        Path path = Paths.get(backup.getFilepath());
        if (!Files.exists(path)) {
            throw new RuntimeException("Backup file not found on disk");
        }

        return Files.readAllBytes(path);
    }

    public void deleteBackup(Long backupId) throws IOException {
        Backup backup = backupRepository.findById(backupId)
                .orElseThrow(() -> new RuntimeException("Backup not found"));

        Path path = Paths.get(backup.getFilepath());
        Files.deleteIfExists(path);
        backupRepository.delete(backup);
    }
}
