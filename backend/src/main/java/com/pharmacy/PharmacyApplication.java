package com.pharmacy;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class PharmacyApplication {

    public static void main(String[] args) {
        SpringApplication.run(PharmacyApplication.class, args);
    }


   /* Configuration in application.properties
# Local backup
    backup.local-path=D:/Project/HSProject/backups
    backup.schedule-cron=0 0 2 * * *    # Daily at 2 AM
    backup.retention-days=30

            # Email (set backup.email.enabled=true to activate)
    backup.email.host=smtp.gmail.com
    backup.email.to=admin@pharmacy.com

# OneDrive (set backup.onedrive.enabled=true to activate)
    backup.onedrive.client-id=your-client-id
    backup.onedrive.client-secret=your-client-secret*/
}
