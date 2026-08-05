package com.pharmacy.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "backup_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Backup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "filename", nullable = false)
    private String filename;

    @Column(name = "filepath", nullable = false)
    private String filepath;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "backup_type", nullable = false)
    private String backupType; // MANUAL, SCHEDULED

    @Column(name = "status", nullable = false)
    private String status; // SUCCESS, FAILED, IN_PROGRESS

    @Builder.Default
    @Column(name = "email_sent")
    private Boolean emailSent = false;

    @Builder.Default
    @Column(name = "onedrive_uploaded")
    private Boolean onedriveUploaded = false;

    @Column(name = "error_message")
    private String errorMessage;

    @Column(name = "created_by")
    private Long createdBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
