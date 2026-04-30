package com.nikhilhrms.controller;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.nikhilhrms.dto.ApiResponse;
import com.nikhilhrms.service.InternalMailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Collections;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/internal-mails")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class InternalMailController {

    @Autowired private InternalMailService internalMailService;
    @Autowired private ObjectMapper objectMapper;

    @PostMapping(value = "/compose", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<Map<String, Object>>> compose(@RequestBody Map<String, Object> request) {
        return created("Mail sent", internalMailService.compose(request, Collections.emptyList()));
    }

    @PostMapping(value = "/compose", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Map<String, Object>>> composeMultipart(
            @RequestPart("payload") String payload,
            @RequestPart(value = "files", required = false) List<MultipartFile> files
    ) {
        return created("Mail sent", internalMailService.compose(parse(payload), files));
    }

    @PostMapping("/draft")
    public ResponseEntity<ApiResponse<Map<String, Object>>> draft(@RequestBody Map<String, Object> request) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Draft saved", internalMailService.saveDraft(request)));
    }

    @GetMapping("/inbox")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> inbox(@RequestParam(required = false) String filter) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Inbox retrieved", internalMailService.inbox(filter)));
    }

    @GetMapping("/sent")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> sent() {
        return ResponseEntity.ok(new ApiResponse<>(true, "Sent mails retrieved", internalMailService.sent()));
    }

    @GetMapping("/drafts")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> drafts() {
        return ResponseEntity.ok(new ApiResponse<>(true, "Drafts retrieved", internalMailService.drafts()));
    }

    @GetMapping("/trash")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> trash() {
        return ResponseEntity.ok(new ApiResponse<>(true, "Trash retrieved", internalMailService.trash()));
    }

    @GetMapping("/starred")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> starred() {
        return ResponseEntity.ok(new ApiResponse<>(true, "Starred mails retrieved", internalMailService.starred()));
    }

    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<Map<String, Object>>> summary() {
        return ResponseEntity.ok(new ApiResponse<>(true, "Mail summary retrieved", internalMailService.summary()));
    }

    @GetMapping("/contacts")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> contacts() {
        return ResponseEntity.ok(new ApiResponse<>(true, "Contacts retrieved", internalMailService.contacts()));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> search(@RequestParam(defaultValue = "") String query) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Search results retrieved", internalMailService.search(query)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> message(@PathVariable Long id) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Mail retrieved", internalMailService.messageDetail(id)));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Map<String, Object>>> read(@PathVariable Long id) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Mail marked read", internalMailService.markRead(id, true)));
    }

    @PutMapping("/{id}/unread")
    public ResponseEntity<ApiResponse<Map<String, Object>>> unread(@PathVariable Long id) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Mail marked unread", internalMailService.markRead(id, false)));
    }

    @PutMapping("/{id}/star")
    public ResponseEntity<ApiResponse<Map<String, Object>>> star(@PathVariable Long id) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Mail star updated", internalMailService.toggleStar(id)));
    }

    @PutMapping("/{id}/important")
    public ResponseEntity<ApiResponse<Map<String, Object>>> important(@PathVariable Long id) {
        return ResponseEntity.ok(new ApiResponse<>(true, "Mail importance updated", internalMailService.toggleImportant(id)));
    }

    @PostMapping(value = "/{id}/reply", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<Map<String, Object>>> reply(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        return created("Reply sent", internalMailService.reply(id, request, Collections.emptyList()));
    }

    @PostMapping(value = "/{id}/reply", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Map<String, Object>>> replyMultipart(
            @PathVariable Long id,
            @RequestPart("payload") String payload,
            @RequestPart(value = "files", required = false) List<MultipartFile> files
    ) {
        return created("Reply sent", internalMailService.reply(id, parse(payload), files));
    }

    @PostMapping(value = "/{id}/forward", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ApiResponse<Map<String, Object>>> forward(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        return created("Mail forwarded", internalMailService.forward(id, request, Collections.emptyList()));
    }

    @PostMapping(value = "/{id}/forward", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Map<String, Object>>> forwardMultipart(
            @PathVariable Long id,
            @RequestPart("payload") String payload,
            @RequestPart(value = "files", required = false) List<MultipartFile> files
    ) {
        return created("Mail forwarded", internalMailService.forward(id, parse(payload), files));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        internalMailService.delete(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Mail moved to trash"));
    }

    @PostMapping("/mailboxes/{employeeId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createMailbox(@PathVariable Long employeeId) {
        return created("Mailbox created", internalMailService.createMailbox(employeeId));
    }

    @PostMapping("/mailboxes/sync")
    public ResponseEntity<ApiResponse<Void>> syncMailboxes() {
        internalMailService.syncMailboxes();
        return ResponseEntity.ok(new ApiResponse<>(true, "Internal mailboxes synced"));
    }

    private ResponseEntity<ApiResponse<Map<String, Object>>> created(String message, Map<String, Object> data) {
        return ResponseEntity.status(HttpStatus.CREATED).body(new ApiResponse<>(true, message, data));
    }

    private Map<String, Object> parse(String payload) {
        try {
            return objectMapper.readValue(payload, new TypeReference<>() {});
        } catch (Exception e) {
            throw new RuntimeException("Invalid mail payload");
        }
    }
}
