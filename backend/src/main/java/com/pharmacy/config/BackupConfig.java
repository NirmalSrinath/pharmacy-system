package com.pharmacy.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

@Data
@Configuration
@ConfigurationProperties(prefix = "backup")
public class BackupConfig {

    private boolean enabled = true;
    private String localPath = "D:/Project/HSProject/backups";
    private String mysqldumpPath = "C:/Program Files/MySQL/MySQL Server 8.0/bin/mysqldump.exe";
    private String scheduleCron = "0 0 2 * * *";
    private int retentionDays = 30;
    private boolean compress = true;

    private EmailConfig email = new EmailConfig();
    private OneDriveConfig onedrive = new OneDriveConfig();

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }

    @Data
    public static class EmailConfig {
        private boolean enabled = false;
        private String host = "smtp.gmail.com";
        private int port = 587;
        private String username;
        private String password;
        private String to;
    }

    @Data
    public static class OneDriveConfig {
        private boolean enabled = false;
        private String clientId;
        private String clientSecret;
        private String tenantId;
        private String folder = "/PharmacyBackups";
    }
}
