package com.pharmacy.service;

import com.pharmacy.config.BackupConfig;
import com.pharmacy.entity.Backup;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.io.File;
import java.io.IOException;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class OneDriveService {

    private final BackupConfig backupConfig;
    private final RestTemplate restTemplate;

    private static final String GRAPH_BASE_URL = "https://graph.microsoft.com/v1.0";

    @Async
    public void uploadBackup(Backup backup) throws IOException {
        if (!backupConfig.getOnedrive().isEnabled()) {
            log.info("OneDrive is disabled, skipping upload");
            return;
        }

        try {
            String accessToken = getAccessToken();

            File backupFile = new File(backup.getFilepath());
            if (!backupFile.exists()) {
                throw new IOException("Backup file not found: " + backup.getFilepath());
            }

            String folderPath = backupConfig.getOnedrive().getFolder();
            String fileName = backup.getFilename();

            // Create folder if it doesn't exist
            ensureFolderExists(accessToken, folderPath);

            // Upload file
            uploadFile(accessToken, folderPath, fileName, backupFile);

            log.info("Backup uploaded to OneDrive successfully: {}/{}", folderPath, fileName);

        } catch (Exception e) {
            log.error("Failed to upload backup to OneDrive", e);
            throw new IOException("OneDrive upload failed: " + e.getMessage(), e);
        }
    }

    @SuppressWarnings("unchecked")
    private String getAccessToken() {
        String tokenUrl = "https://login.microsoftonline.com/" + backupConfig.getOnedrive().getTenantId() + "/oauth2/v2.0/token";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "client_credentials");
        body.add("client_id", backupConfig.getOnedrive().getClientId());
        body.add("client_secret", backupConfig.getOnedrive().getClientSecret());
        body.add("scope", "https://graph.microsoft.com/.default");

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);

        ResponseEntity<Map> response = restTemplate.postForEntity(tokenUrl, request, Map.class);
        if (response.getBody() != null && response.getBody().containsKey("access_token")) {
            return (String) response.getBody().get("access_token");
        }
        throw new RuntimeException("Failed to get OneDrive access token");
    }

    private HttpHeaders createAuthHeaders(String accessToken) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }

    @SuppressWarnings("unchecked")
    private void ensureFolderExists(String accessToken, String folderPath) {
        try {
            String[] folders = folderPath.split("/");
            String currentPath = "";

            for (String folder : folders) {
                if (folder.isEmpty()) continue;
                currentPath += "/" + folder;

                String checkUrl = GRAPH_BASE_URL + "/me/drive/root:" + currentPath;
                HttpEntity<Void> request = new HttpEntity<>(createAuthHeaders(accessToken));

                try {
                    restTemplate.exchange(checkUrl, HttpMethod.GET, request, Map.class);
                } catch (Exception e) {
                    // Folder doesn't exist, create it
                    String createUrl = GRAPH_BASE_URL + "/me/drive/root:/children";
                    String createBody = String.format(
                            "{\"name\": \"%s\", \"folder\": {}, \"@microsoft.graph.conflictBehavior\": \"fail\"}",
                            folder
                    );
                    HttpEntity<String> createRequest = new HttpEntity<>(createBody, createAuthHeaders(accessToken));
                    restTemplate.postForEntity(createUrl, createRequest, Map.class);
                    log.info("Created OneDrive folder: {}", currentPath);
                }
            }
        } catch (Exception e) {
            log.warn("Error ensuring OneDrive folder exists: {}", e.getMessage());
        }
    }

    @SuppressWarnings("unchecked")
    private void uploadFile(String accessToken, String folderPath, String fileName, File file) throws IOException {
        String uploadUrl = GRAPH_BASE_URL + "/me/drive/root:" + folderPath + "/" + fileName + ":/content";

        HttpHeaders headers = createAuthHeaders(accessToken);
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);

        HttpEntity<File> request = new HttpEntity<>(file, headers);

        ResponseEntity<Map> response = restTemplate.exchange(
                uploadUrl,
                HttpMethod.PUT,
                request,
                Map.class
        );

        if (response.getStatusCode() != HttpStatus.OK && response.getStatusCode() != HttpStatus.CREATED) {
            throw new IOException("OneDrive upload failed with status: " + response.getStatusCode());
        }
    }
}
