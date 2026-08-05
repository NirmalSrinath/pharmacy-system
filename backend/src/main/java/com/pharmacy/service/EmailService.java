package com.pharmacy.service;

import com.pharmacy.config.BackupConfig;
import com.pharmacy.entity.Backup;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.FileSystemResource;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.File;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final BackupConfig backupConfig;

    @Async
    public void sendBackupEmail(Backup backup) throws MessagingException {
        if (!backupConfig.getEmail().isEnabled()) {
            log.info("Email is disabled, skipping backup email");
            return;
        }

        JavaMailSender mailSender = createMailSender();
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true);

        helper.setFrom(backupConfig.getEmail().getUsername());
        helper.setTo(backupConfig.getEmail().getTo());
        helper.setSubject("Pharmacy Database Backup - " + backup.getFilename());

        String htmlContent = buildEmailContent(backup);
        helper.setText(htmlContent, true);

        // Attach backup file
        File backupFile = new File(backup.getFilepath());
        if (backupFile.exists()) {
            FileSystemResource resource = new FileSystemResource(backupFile);
            helper.addAttachment(backup.getFilename(), resource);
        }

        mailSender.send(message);
        log.info("Backup email sent successfully to {}", backupConfig.getEmail().getTo());
    }

    private String buildEmailContent(Backup backup) {
        String formattedDate = backup.getCreatedAt() != null
                ? backup.getCreatedAt().format(DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a"))
                : "N/A";

        return """
                <!DOCTYPE html>
                <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
                        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                        .header { background: linear-gradient(135deg, #1976d2, #1565c0); color: white; padding: 20px; text-align: center; }
                        .header h1 { margin: 0; font-size: 24px; }
                        .content { padding: 20px; }
                        .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
                        .info-label { font-weight: bold; color: #555; }
                        .info-value { color: #333; }
                        .status-success { color: #4caf50; font-weight: bold; }
                        .status-failed { color: #f44336; font-weight: bold; }
                        .footer { text-align: center; padding: 15px; background: #f9f9f9; color: #666; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>PharmaCare Backup</h1>
                            <p>Daily Database Backup Report</p>
                        </div>
                        <div class="content">
                            <div class="info-row">
                                <span class="info-label">Status:</span>
                                <span class="%s">%s</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Filename:</span>
                                <span class="info-value">%s</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">File Size:</span>
                                <span class="info-value">%s</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Date & Time:</span>
                                <span class="info-value">%s</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Backup Type:</span>
                                <span class="info-value">%s</span>
                            </div>
                        </div>
                        <div class="footer">
                            This is an automated email from PharmaCare Pharmacy Management System.
                        </div>
                    </div>
                </body>
                </html>
                """.formatted(
                "SUCCESS".equals(backup.getStatus()) ? "status-success" : "status-failed",
                backup.getStatus(),
                backup.getFilename(),
                formatFileSize(backup.getFileSize()),
                formattedDate,
                backup.getBackupType()
        );
    }

    private String formatFileSize(Long bytes) {
        if (bytes == null) return "N/A";
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return String.format("%.1f KB", bytes / 1024.0);
        return String.format("%.2f MB", bytes / (1024.0 * 1024));
    }

    private JavaMailSender createMailSender() {
        JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
        mailSender.setHost(backupConfig.getEmail().getHost());
        mailSender.setPort(backupConfig.getEmail().getPort());
        mailSender.setUsername(backupConfig.getEmail().getUsername());
        mailSender.setPassword(backupConfig.getEmail().getPassword());

        java.util.Properties props = mailSender.getJavaMailProperties();
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.smtp.connectiontimeout", "5000");
        props.put("mail.smtp.timeout", "5000");

        return mailSender;
    }
}
